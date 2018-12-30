import React from 'react'
import styled from 'styled-components'

import { nullArray } from '../utils'
import { MovementHandler } from '../components/utils'

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
    if (columnIndex === 10 && rowIndex === 10) {
      return <CellContainer>This is a test</CellContainer>
    }
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

export default class Home extends React.Component {
  render() {
    return (
      <Container>
        <MovementHandler tileSize={tileSize}>
          {offset => (
            <GridContainer id="gridContainer" offset={offset}>
              <Grid columnCount={2} rowCount={2} CellComponent={SubGrid} />
            </GridContainer>
          )}
        </MovementHandler>
        <Character />
      </Container>
    )
  }
}
