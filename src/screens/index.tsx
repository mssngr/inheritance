import React from 'react'
import styled, { StyledComponent } from 'styled-components'
import { forEach } from 'lodash'
import keyMirror from 'keymirror'
import { TweenLite } from 'gsap'

import { nullArray } from '../utils'

/* TYPES */
interface OffsetState {
  x: number
  y: number
}

interface CellProps {
  rowIndex: number
  columnIndex: number
}

/* STYLES */
const tileSize = 50

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`

const Character = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${tileSize / 1.5}px;
  height: ${tileSize / 1.5}px;
  background-color: cyan;
  border-radius: 50%;
`

const GridContainer = styled<any>('div').attrs({
  style: ({ offset }: { offset: OffsetState }) => ({
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  }),
})`
  position: absolute;
  top: calc(50% - ${tileSize / 2}px);
  left: calc(50% - ${tileSize / 2}px);
`

const RowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
`

const CellComponentsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`

const CellContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${tileSize}px;
  height: ${tileSize}px;
  border: 1px solid gray;
  color: gray;
  box-sizing: border-box;
  font-size: 10px;
`

/* UTILS */
const directions: { [key: string]: string } = keyMirror({
  UP: null,
  LEFT: null,
  DOWN: null,
  RIGHT: null,
})

/* PRESENTATION */
class Cell extends React.PureComponent<
  CellProps & {
    upperRowIndex: number
    upperColumnIndex: number
    columnCount: number
    rowCount: number
  }
> {
  render() {
    const {
      rowIndex,
      columnIndex,
      upperRowIndex,
      upperColumnIndex,
      columnCount,
      rowCount,
    } = this.props
    return (
      <CellContainer>
        {upperColumnIndex * columnCount + columnIndex},
        {upperRowIndex * rowCount + rowIndex}
      </CellContainer>
    )
  }
}

const renderCellComponent: (
  columnIndex: number,
  rowIndex: number,
  columnCount: number,
  rowCount: number
) => React.SFC<CellProps> = (
  columnIndex,
  rowIndex,
  columnCount,
  rowCount
) => props => (
  <Cell
    upperColumnIndex={columnIndex}
    upperRowIndex={rowIndex}
    columnCount={columnCount}
    rowCount={rowCount}
    {...props}
  />
)

const SubGrid: React.SFC<CellProps> = props => {
  const columnCount = 20
  const rowCount = 20
  return (
    <Grid
      columnCount={columnCount}
      rowCount={rowCount}
      CellComponent={renderCellComponent(
        props.columnIndex,
        props.rowIndex,
        columnCount,
        rowCount
      )}
      {...props}
    />
  )
}

class Row extends React.PureComponent<{
  rowIndex: number
  columnCount: number
  CellComponent: React.FunctionComponent<CellProps>
}> {
  render() {
    const { columnCount, rowIndex, CellComponent } = this.props
    return (
      <CellComponentsContainer>
        {nullArray(columnCount).map((item: null, index: number) => (
          <CellComponent
            key={`${rowIndex}-${index}`}
            rowIndex={rowIndex}
            columnIndex={index}
          />
        ))}
      </CellComponentsContainer>
    )
  }
}

class Grid extends React.PureComponent<{
  columnCount: number
  rowCount: number
  CellComponent: React.FunctionComponent<CellProps>
}> {
  render() {
    const { columnCount, rowCount, CellComponent } = this.props
    return (
      <RowsContainer>
        {nullArray(rowCount).map((item: null, index: number) => (
          <Row
            key={`${index}`}
            rowIndex={index}
            columnCount={columnCount}
            CellComponent={CellComponent}
          />
        ))}
      </RowsContainer>
    )
  }
}

interface HomeState {
  offset: OffsetState
  isMoving: {
    [key: string]: boolean
  }
}

export default class Home extends React.Component<{}, HomeState> {
  render() {
    return (
      <Container>
        <GridContainer id="gridContainer" offset={this.state.offset}>
          <Grid columnCount={2} rowCount={2} CellComponent={SubGrid} />
        </GridContainer>
        <Character />
      </Container>
    )
  }

  state = {
    offset: {
      x: 0,
      y: 0,
    },
    isMoving: {
      [directions.UP]: false,
      [directions.LEFT]: false,
      [directions.DOWN]: false,
      [directions.RIGHT]: false,
    },
  }

  offsetX: { x: number } = {
    x: 0,
  }

  offsetY: { y: number } = {
    y: 0,
  }

  componentDidMount() {
    document.addEventListener(
      'keypress',
      this.generateKeyPressHandler('keypress')
    )
    document.addEventListener('keyup', this.generateKeyPressHandler('keyup'))
  }

  componentDidUpdate(prevProps: {}, prevState: HomeState) {
    const { isMoving } = this.state
    forEach(prevState.isMoving, (value: boolean, key: string) => {
      // Only trigger animation start or stop if the state changed
      if (value !== isMoving[key]) {
        if (isMoving[key]) {
          this.animateMovementStart()
        } else {
          this.animateMovementStop()
        }
      }
    })
  }

  componentWillUnmount() {
    document.removeEventListener(
      'keypress',
      this.generateKeyPressHandler('keypress')
    )
    document.removeEventListener('keyup', this.generateKeyPressHandler('keyup'))
  }

  generateKeyPressHandler = (pressType: String) => (e: KeyboardEvent) => {
    const { isMoving } = this.state
    switch (e.key) {
      case 'w': {
        if (isMoving[directions.UP] !== (pressType === 'keypress')) {
          this.setState({
            isMoving: {
              ...isMoving,
              [directions.UP]: pressType === 'keypress',
            },
          })
        }
        break
      }
      case 'a': {
        if (isMoving[directions.LEFT] !== (pressType === 'keypress')) {
          this.setState({
            isMoving: {
              ...isMoving,
              [directions.LEFT]: pressType === 'keypress',
            },
          })
        }
        break
      }
      case 's': {
        if (isMoving[directions.DOWN] !== (pressType === 'keypress')) {
          this.setState({
            isMoving: {
              ...isMoving,
              [directions.DOWN]: pressType === 'keypress',
            },
          })
        }
        break
      }
      case 'd': {
        if (isMoving[directions.RIGHT] !== (pressType === 'keypress')) {
          this.setState({
            isMoving: {
              ...isMoving,
              [directions.RIGHT]: pressType === 'keypress',
            },
          })
        }
        break
      }
    }
  }

  animateMovement = () => {
    forEach(this.state.isMoving, (isDirectionMoving, direction) => {
      if (isDirectionMoving) {
        switch (direction) {
          case directions.UP: {
            TweenLite.to(this.offsetY, 0.1, {
              y: this.state.offset.y + 10,
              onUpdate: () => {
                this.setState({
                  offset: { ...this.state.offset, y: this.offsetY.y },
                })
              },
            })
            break
          }
          case directions.LEFT: {
            TweenLite.to(this.offsetX, 0.1, {
              x: this.state.offset.x + 10,
              onUpdate: () => {
                this.setState({
                  offset: { ...this.state.offset, x: this.offsetX.x },
                })
              },
            })
            break
          }
          case directions.DOWN: {
            TweenLite.to(this.offsetY, 0.1, {
              y: this.state.offset.y - 10,
              onUpdate: () => {
                this.setState({
                  offset: { ...this.state.offset, y: this.offsetY.y },
                })
              },
            })
            break
          }
          case directions.RIGHT: {
            TweenLite.to(this.offsetX, 0.1, {
              x: this.state.offset.x - 10,
              onUpdate: () => {
                this.setState({
                  offset: { ...this.state.offset, x: this.offsetX.x },
                })
              },
            })
            break
          }
        }
      }
    })
  }

  moveAnimationInterval?: number = undefined

  animateMovementStart = () => {
    this.animateMovement()
    this.moveAnimationInterval = window.setInterval(this.animateMovement, 100)
  }

  animateMovementStop = () => {
    if (this.moveAnimationInterval) {
      window.clearInterval(this.moveAnimationInterval)
    }
  }
}
