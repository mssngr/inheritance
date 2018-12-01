import React from 'react'

import Grid from '../components/Grid'

const columnCount = 4000
const rowCount = 4000

export default class Home extends React.Component {
  render() {
    return (
      <Grid
        columnCount={columnCount}
        rowCount={rowCount}
        estimatedColumnWidth={128}
        estimatedRowHeight={32}
        renderCell={this.renderCell}
        columnWidth={this.calculateColumnWidth}
        rowHeight={this.calculateRowHeight}
      />
    )
  }

  calculateColumnWidth = (column: number) => {
    // calculate the width, or null if you're not sure yet because data hasn't loaded
    return 128
  }

  calculateRowHeight = (row: number) => {
    // calculate the height, or null if you're not sure yet because data hasn't loaded
    return 32
  }

  renderCell = (
    row: number,
    rowData: number[],
    column: number,
    columnData: number[]
  ) => {
    const [colIndex, colLeft, width] = columnData
    const [rowIndex, rowTop, height] = rowData

    // const cellNumber = (rowIndex * this.state.columnCount) + colIndex;

    const left = column < 1 ? 0 : colLeft
    const top = row < 1 ? 0 : rowTop

    const attrs = { left, top, width, height }

    const title = rowIndex + '-' + colIndex

    return (
      <div key={rowIndex + '-' + colIndex} style={attrs}>
        {title}
      </div>
    )
  }
}
