import React from 'react'
import styled, { StyledComponent } from 'styled-components'

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
  background-color: black;
  border-radius: 50%;
`

const GridContainer = styled<any>('div')`
  position: absolute;
  top: calc(50% - ${tileSize / 2}px);
  left: calc(50% - ${tileSize / 2}px);
  transform: translate(
    ${props => props.offset.x}px,
    ${props => props.offset.y}px
  );
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
  background-color: white;
  box-sizing: border-box;
  font-size: 10px;
`

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

export default class Home extends React.Component<{}, { offset: OffsetState }> {
  state = {
    offset: {
      x: 0,
      y: 0,
    },
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeydown)
  }

  handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'w': {
        console.log('up')
        break
      }
      case 'a': {
        console.log('left')
        break
      }
      case 's': {
        console.log('down')
        break
      }
      case 'd': {
        console.log('right')
        break
      }
    }
  }

  animate = () => {}

  animateStart = () => {
    this.animate()
    this.animateInterval = window.setInterval(this.animate, 1)
  }

  animateStop = () => {
    if (this.animateInterval) {
      window.clearInterval(this.animateInterval)
    }
    this.state.charPos.stopAnimation()
  }

  render() {
    return (
      <Container>
        <GridContainer offset={this.state.offset}>
          <Grid columnCount={2} rowCount={2} CellComponent={SubGrid} />
        </GridContainer>
        <Character />
      </Container>
    )
  }
}
