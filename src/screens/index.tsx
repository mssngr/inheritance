import React from 'react'
import styled from 'styled-components'

import { nullArray } from 'utils'

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

const GridContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

const SubRowContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
`

const CellContainer = styled.div`
  width: ${tileSize}px;
  height: ${tileSize}px;
  border: 1px solid gray;
  background-color: white;
  box-sizing: border-box;
`

/* PRESENTATION */
interface CellProps {
  rowIndex: number
  columnIndex: number
}
class Cell extends React.PureComponent<
  CellProps & {
    upperRowIndex: number
    upperColumnIndex: number
  }
> {
  render() {
    const {
      rowIndex,
      columnIndex,
      upperRowIndex,
      upperColumnIndex,
    } = this.props
    return (
      <CellContainer>
        {upperColumnIndex},{upperRowIndex}
        <br />
        {columnIndex},{rowIndex}
      </CellContainer>
    )
  }
}

const renderCellComponent: (
  columnIndex: number,
  rowIndex: number
) => React.SFC<CellProps> = (columnIndex, rowIndex) => props => (
  <Cell upperColumnIndex={columnIndex} upperRowIndex={rowIndex} {...props} />
)

const SubGrid: React.SFC<CellProps> = props => (
  <Grid
    columnCount={20}
    rowCount={20}
    CellComponent={renderCellComponent(props.columnIndex, props.rowIndex)}
    {...props}
  />
)

class Row extends React.PureComponent<{
  rowIndex: number
  columnCount: number
  CellComponent: React.FunctionComponent<CellProps>
}> {
  render() {
    const { columnCount, rowIndex, CellComponent } = this.props
    return nullArray(columnCount).map((item: null, index: number) => (
      <CellComponent
        key={`${rowIndex}-${index}`}
        rowIndex={rowIndex}
        columnIndex={index}
      />
    ))
  }
}

class Grid extends React.PureComponent<{
  columnCount: number
  rowCount: number
  CellComponent: React.FunctionComponent<CellProps>
}> {
  render() {
    const { columnCount, rowCount, CellComponent } = this.props
    return nullArray(rowCount).map((item: null, index: number) => (
      <Row
        key={`${index}`}
        rowIndex={index}
        columnCount={columnCount}
        CellComponent={CellComponent}
      />
    ))
  }
}

export default class Home extends React.Component {
  render() {
    return (
      <Container>
        <GridContainer>
          <Grid columnCount={20} rowCount={20} CellComponent={SubGrid} />
        </GridContainer>
        <Character />
      </Container>
    )
  }
}
