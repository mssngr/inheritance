import React, { CSSProperties } from 'react'
import cx from 'classnames'
import elementResizeDetector from 'element-resize-detector'
import IScroll from 'iscroll/build/iscroll-probe'
import GridCalculator from './calculator'

/* eslint-disable react/no-unused-prop-types */

const styles: {
  container: CSSProperties
  scrollOverlay: CSSProperties
  scrollContainer: CSSProperties
  scrollContent: CSSProperties
  gridBody: CSSProperties
  pane: CSSProperties
  translatedPane: CSSProperties
  columnResizeGuide: CSSProperties
  rowResizeGuide: CSSProperties
} = {
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  scrollOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  scrollContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {},
  gridBody: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  pane: {
    position: 'absolute',
    overflow: 'hidden',
  },
  translatedPane: {},
  columnResizeGuide: {
    position: 'absolute',
    top: 1,
    bottom: 0,
    width: 1,
    backgroundColor: '#18a3f7',
    cursor: 'ew-resize',
    borderRadius: 0,
  },
  rowResizeGuide: {
    position: 'absolute',
    left: 1,
    right: 0,
    height: 1,
    backgroundColor: '#18a3f7',
    cursor: 'ns-resize',
    borderRadius: 0,
  },
}

interface Props {
  preloadPixelsX?: number
  preloadPixelsY?: number
  estimatedRowHeight?: number
  estimatedColumnWidth?: number
  columnCount: number
  rowCount: number
  fixedLeftColumnCount?: number
  fixedRightColumnCount?: number
  fixedHeaderCount?: number
  fixedFooterCount?: number
  columnWidth?: (column: number) => number | number
  rowHeight?: (row: number) => number | number
  renderRow?: (
    pane: unknown,
    cells: unknown,
    rowData: number[],
    columnRange: number
  ) => JSX.Element
  renderRows?: (rows: JSX.Element) => JSX.Element
  renderCell?: (
    row: number,
    rowData: number[],
    column: number,
    columnData: number[]
  ) => JSX.Element
  renderCells?: (cells: JSX.Element) => JSX.Element
  onExtentsChange?: (
    fromRow: number,
    toRow: number,
    fromColumn: number,
    toColumn: number
  ) => void
  onScrollStart?: (
    arg: {
      state: object
      _scrolling: boolean
    }
  ) => void
  onScroll?: (arg: object) => void
  onScrollEnd?: (
    arg: {
      state: object
      _scrolling: boolean
    }
  ) => void
  scrollOptions?: object
}

export default class Grid extends React.Component<Props> {
  static defaultProps = {
    preloadPixelsX: 0,
    preloadPixelsY: 0,
    fixedLeftColumnCount: 0,
    fixedRightColumnCount: 0,
    fixedHeaderCount: 0,
    fixedFooterCount: 0,
    estimatedColumnWidth: 130,
    estimatedRowHeight: 30,
  }

  state: {
    cells: any
  } = {
    cells: undefined,
  }

  _root: HTMLElement = document.createElement('div')
  _scrollOverlay: HTMLElement = document.createElement('div')
  _scrollInner: HTMLElement = document.createElement('div')
  _leftPane: HTMLElement = document.createElement('div')
  _leftPaneHeader: HTMLElement = document.createElement('div')
  _leftPaneFooter: HTMLElement = document.createElement('div')
  _leftPaneBody: HTMLElement = document.createElement('div')
  _rightPane: HTMLElement = document.createElement('div')
  _rightPaneHeader: HTMLElement = document.createElement('div')
  _rightPaneFooter: HTMLElement = document.createElement('div')
  _rightPaneBody: HTMLElement = document.createElement('div')
  _centerPane: HTMLElement = document.createElement('div')
  _centerPaneHeader: HTMLElement = document.createElement('div')
  _centerPaneFooter: HTMLElement = document.createElement('div')
  _centerPaneBody: HTMLElement = document.createElement('div')
  _scrolling: boolean = false
  _pinnedColumnWidths: number[] = []
  _pinnedRowHeights: number[] = []
  _lastScrollableWidth?: number = undefined
  _lastScrollableHeight?: number = undefined
  _sizeDetector = elementResizeDetector({ strategy: 'scroll' })
  _scroller = new IScroll(this._scrollInner, this.props.scrollOptions)
  _resizingColumn?: number | null = undefined
  _resizingRow?: number | null = undefined
  _calculator?: GridCalculator = undefined

  styles = styles

  componentDidMount() {
    this._sizeDetector.listenTo(this._root, this.handleResize)

    this.update(0, 0)

    const scrollOptions = {
      disableMouse: true,
      bounce: false, // disable bounce because we're already customizing positioning
      scrollX: true,
      freeScroll: true,
      scrollbars: true,
      probeType: 3,
      mouseWheel: true,
      preventDefault: false,
      interactiveScrollbars: true,
      ...this.props.scrollOptions,
    }

    this._scroller = new IScroll(this._scrollInner, scrollOptions)
    this._scroller.on('scroll', this.handleScroll)
    this._scroller.on('scrollStart', this.handleScrollStart)
    this._scroller.on('scrollEnd', this.handleScrollEnd)
  }

  componentWillReceiveProps(nextProps: Props) {
    this.refresh(true, nextProps)
  }

  componentWillUnmount() {
    this._sizeDetector.uninstall(this._root)

    this._scroller.off('scroll', this.handleScroll)
    this._scroller.off('scrollStart', this.handleScrollStart)
    this._scroller.off('scrollEnd', this.handleScrollEnd)
    this._scroller.destroy()
  }

  render() {
    const contentStyle: CSSProperties = {
      ...this.styles.scrollContent,
      position: 'absolute',
      width: this.calculateScrollableWidth(
        {
          estimatedColumnWidth: this.props.estimatedColumnWidth,
          columnCount: this.props.columnCount,
        },
        this.state.cells
      ),
      height: this.calculateScrollableHeight(
        {
          estimatedRowHeight: this.props.estimatedRowHeight,
          rowCount: this.props.rowCount,
        },
        this.state.cells
      ),
    }

    return (
      <div style={styles.container} ref={this.bindRoot} key="grid-root">
        <div
          style={styles.scrollOverlay}
          ref={this.bindScrollOverlay}
          key="grid-scroll-overlay"
        >
          <div
            className="scroll-inner"
            style={styles.scrollContainer}
            ref={this.bindScrollInner}
            key="grid-scroll-inner"
          >
            <div
              className={cx('scroll-container')}
              style={contentStyle}
              key="grid-scroll-container"
            >
              <div style={styles.gridBody} key="grid-scroll-body">
                {this.renderLeftPane()}
                {this.renderRightPane()}
                {this.renderCenterPane()}
                {this.renderColumnResizeGuide()}
                {this.renderRowResizeGuide()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderLeftPane() {
    const attrs = {
      ...this.styles.pane,
      left: 0,
      width: this.fixedLeftColumnsWidth,
    }

    return (
      <div
        ref={this.bindLeftPane}
        className={cx('left-pane')}
        style={attrs}
        key="grid-left-pane"
      >
        {this.renderLeftPaneHeader()}
        {this.renderLeftPaneFooter()}
        {this.renderLeftPaneBody()}
      </div>
    )
  }

  renderLeftPaneHeader() {
    if (!this.state.cells || (this.props.fixedLeftColumnCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: 0,
      right: 0,
      height: this.calculateFixedHeadersHeight(this.state.cells),
    }

    const contentStyle: CSSProperties = {}

    return (
      <div
        ref={this.bindLeftPaneHeader}
        className={cx('left-pane-header')}
        style={attrs}
        key="grid-left-pane-header"
      >
        <div style={contentStyle} key="grid-left-pane-header-content">
          {this.renderCellRange(
            'left-pane-header',
            0,
            (this.props.fixedHeaderCount || 0) - 1,
            0,
            (this.props.fixedLeftColumnCount || 0) - 1,
            this.state.cells.topLeftRows,
            this.state.cells.topLeftColumns
          )}
        </div>
      </div>
    )
  }

  renderLeftPaneFooter() {
    if (
      !this.state.cells ||
      (this.props.fixedLeftColumnCount || 0) < 1 ||
      (this.props.fixedFooterCount || 0) < 1
    ) {
      return null
    }
    const attrs = {
      ...this.styles.pane,
      left: 0,
      bottom: 0,
      right: 0,
      height: this.calculateFixedFootersHeight(this.state.cells),
    }

    const contentStyle: CSSProperties = {}

    const fromRow =
      this.props.rowCount > 0
        ? this.props.rowCount - (this.props.fixedFooterCount || 0)
        : 0
    const toRow = fromRow
      ? fromRow + (this.props.fixedFooterCount || 0) - 1
      : null

    return (
      <div
        ref={this.bindLeftPaneFooter}
        className={cx('left-pane-footer')}
        style={attrs}
        key="grid-left-pane-footer"
      >
        <div style={contentStyle} key="grid-left-pane-footer-content">
          {this.renderCellRange(
            'left-pane-footer',
            fromRow,
            toRow,
            0,
            (this.props.fixedLeftColumnCount || 0) - 1,
            this.state.cells.bottomLeftRows,
            this.state.cells.bottomLeftColumns
          )}
        </div>
      </div>
    )
  }

  renderLeftPaneBody() {
    if (!this.state.cells || (this.props.fixedLeftColumnCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: this.calculateFixedHeadersHeight(this.state.cells),
      right: 0,
      bottom: this.calculateFixedFootersHeight(this.state.cells),
    }

    const contentStyle: CSSProperties = {
      position: 'absolute',
      width: this.props.estimatedColumnWidth,
      height: (this.props.estimatedRowHeight || 0) * this.props.rowCount,
      ...this.styles.translatedPane,
    }

    const fromRow = this.state.cells.leftRows.length
      ? this.state.cells.leftRows[0][0]
      : null
    const toRow = this.state.cells.leftRows.length
      ? this.state.cells.leftRows[this.state.cells.leftRows.length - 1][0]
      : null

    return (
      <div
        ref={this.bindLeftPaneBody}
        className={cx('left-pane-body')}
        style={attrs}
        key="grid-left-pane-body"
      >
        <div style={contentStyle} key="grid-left-pane-body-content">
          {this.renderCellRange(
            'left-pane-body',
            fromRow,
            toRow,
            0,
            (this.props.fixedLeftColumnCount || 0) - 1,
            this.state.cells.leftRows,
            this.state.cells.leftColumns
          )}
        </div>
      </div>
    )
  }

  renderRightPane() {
    if (!this.state.cells || (this.props.fixedRightColumnCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      right: 0,
      width: this.fixedRightColumnsWidth,
    }

    return (
      <div
        ref={this.bindRightPane}
        className={cx('right-pane')}
        style={attrs}
        key="grid-right-pane"
      >
        {this.renderRightPaneHeader()}
        {this.renderRightPaneFooter()}
        {this.renderRightPaneBody()}
      </div>
    )
  }

  renderRightPaneHeader() {
    if (!this.state.cells || (this.props.fixedRightColumnCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: 0,
      right: 0,
      height: this.calculateFixedHeadersHeight(this.state.cells),
    }

    const contentStyle = {}

    const fromColumn =
      this.props.columnCount > 0
        ? this.props.columnCount - (this.props.fixedRightColumnCount || 0)
        : 0
    const toColumn = fromColumn
      ? fromColumn + (this.props.fixedRightColumnCount || 0) - 1
      : null

    return (
      <div
        ref={this.bindRightPaneHeader}
        className={cx('right-pane-header')}
        style={attrs}
        key="grid-right-pane-header"
      >
        <div style={contentStyle} key="grid-right-pane-header-content">
          {this.renderCellRange(
            'right-pane-header',
            0,
            (this.props.fixedHeaderCount || 0) - 1,
            fromColumn,
            toColumn,
            this.state.cells.topRightRows,
            this.state.cells.topRightColumns
          )}
        </div>
      </div>
    )
  }

  renderRightPaneFooter() {
    if (
      !this.state.cells ||
      (this.props.fixedRightColumnCount || 0) < 1 ||
      (this.props.fixedFooterCount || 0) < 1
    ) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      bottom: 0,
      right: 0,
      height: this.calculateFixedFootersHeight(this.state.cells),
    }

    const contentStyle = {}

    const fromRow =
      this.props.rowCount > 0
        ? this.props.rowCount - (this.props.fixedFooterCount || 0)
        : 0
    const toRow = fromRow
      ? fromRow + (this.props.fixedFooterCount || 0) - 1
      : null

    const fromColumn =
      this.props.columnCount > 0
        ? this.props.columnCount - (this.props.fixedRightColumnCount || 0)
        : 0
    const toColumn = fromColumn
      ? fromColumn + (this.props.fixedRightColumnCount || 0) - 1
      : null

    return (
      <div
        ref={this.bindRightPaneFooter}
        className={cx('right-pane-footer')}
        style={attrs}
        key="grid-right-pane-footer"
      >
        <div style={contentStyle} key="grid-right-pane-footer-content">
          {this.renderCellRange(
            'right-pane-footer',
            fromRow,
            toRow,
            fromColumn,
            toColumn,
            this.state.cells.bottomRightRows,
            this.state.cells.bottomRightColumns
          )}
        </div>
      </div>
    )
  }

  renderRightPaneBody() {
    if (!this.state.cells || (this.props.fixedRightColumnCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: this.calculateFixedHeadersHeight(this.state.cells),
      right: 0,
      bottom: this.calculateFixedFootersHeight(this.state.cells),
    }

    const contentStyle: CSSProperties = {
      position: 'absolute',
      width: this.props.estimatedColumnWidth,
      height: (this.props.estimatedRowHeight || 0) * this.props.rowCount,
      top: -this.calculateFixedHeadersHeight(this.state.cells),
      bottom: -this.calculateFixedFootersHeight(this.state.cells),
      ...this.styles.translatedPane,
    }

    const fromColumn =
      this.props.columnCount > 0
        ? this.props.columnCount - (this.props.fixedRightColumnCount || 0)
        : 0
    const toColumn = fromColumn
      ? fromColumn + (this.props.fixedRightColumnCount || 0) - 1
      : null

    const fromRow = this.state.cells.leftRows.length
      ? this.state.cells.leftRows[0][0]
      : null
    const toRow = this.state.cells.leftRows.length
      ? this.state.cells.leftRows[this.state.cells.leftRows.length - 1][0]
      : null

    return (
      <div
        ref={this.bindRightPaneBody}
        className={cx('right-pane-body')}
        style={attrs}
        key="grid-right-pane-body"
      >
        <div style={contentStyle} key="grid-right-pane-body-content">
          {this.renderCellRange(
            'right-pane-body',
            fromRow,
            toRow,
            fromColumn,
            toColumn,
            this.state.cells.rightRows,
            this.state.cells.rightColumns
          )}
        </div>
      </div>
    )
  }

  renderCenterPane() {
    const attrs = {
      ...this.styles.pane,
      left: this.fixedLeftColumnsWidth,
      right: this.fixedRightColumnsWidth,
    }

    return (
      <div
        ref={this.bindCenterPane}
        className={cx('center-pane')}
        style={attrs}
        key="grid-center-pane"
      >
        {this.renderCenterPaneHeader()}
        {this.renderCenterPaneFooter()}
        {this.renderCenterPaneBody()}
      </div>
    )
  }

  renderCenterPaneHeader() {
    if (!this.state.cells || (this.props.fixedHeaderCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: 0,
      right: 0,
      height: this.calculateFixedHeadersHeight(this.state.cells),
      overflow: 'visible', // TODO(zhm) this is needed for the column menus, what does it possibly break?
    }

    const contentStyle: CSSProperties = {
      position: 'absolute',
      width: (this.props.estimatedColumnWidth || 0) * this.props.columnCount,
      height: this.props.estimatedRowHeight,
      left: -this.fixedLeftColumnsWidth,
      ...this.styles.translatedPane,
    }

    const fromColumn = this.state.cells.topColumns.length
      ? this.state.cells.topColumns[0][0]
      : null
    const toColumn = this.state.cells.topColumns.length
      ? this.state.cells.topColumns[this.state.cells.topColumns.length - 1][0]
      : null

    return (
      <div
        ref={this.bindCenterPaneHeader}
        className={cx('center-pane-header')}
        style={attrs}
        key="grid-center-pane-header"
      >
        <div style={contentStyle} key="grid-center-pane-header-content">
          {this.renderCellRange(
            'center-pane-header',
            0,
            (this.props.fixedHeaderCount || 0) - 1,
            fromColumn,
            toColumn,
            this.state.cells.topRows,
            this.state.cells.topColumns
          )}
        </div>
      </div>
    )
  }

  renderCenterPaneFooter() {
    if (!this.state.cells || (this.props.fixedFooterCount || 0) < 1) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      bottom: 0,
      right: 0,
      height: this.calculateFixedFootersHeight(this.state.cells),
      overflow: 'visible', // TODO(zhm) this is needed for the column menus, what does it possibly break?
    }

    const contentStyle: CSSProperties = {
      position: 'absolute',
      width: (this.props.estimatedColumnWidth || 0) * this.props.columnCount,
      height: this.props.estimatedRowHeight,
      left: -this.fixedLeftColumnsWidth,
      ...this.styles.translatedPane,
    }

    const fromColumn = this.state.cells.bottomColumns.length
      ? this.state.cells.bottomColumns[0][0]
      : null
    const toColumn = this.state.cells.bottomColumns.length
      ? this.state.cells.bottomColumns[
          this.state.cells.bottomColumns.length - 1
        ][0]
      : null

    const fromRow =
      this.props.rowCount > 0
        ? this.props.rowCount - (this.props.fixedFooterCount || 0)
        : 0
    const toRow = fromRow
      ? fromRow + (this.props.fixedFooterCount || 0) - 1
      : null

    return (
      <div
        ref={this.bindCenterPaneFooter}
        className={cx('center-pane-footer')}
        style={attrs}
        key="grid-center-pane-footer"
      >
        <div style={contentStyle} key="grid-center-pane-footer-content">
          {this.renderCellRange(
            'center-pane-footer',
            fromRow,
            toRow,
            fromColumn,
            toColumn,
            this.state.cells.bottomRows,
            this.state.cells.bottomColumns
          )}
        </div>
      </div>
    )
  }

  renderCenterPaneBody() {
    if (!this.state.cells) {
      return null
    }

    const attrs = {
      ...this.styles.pane,
      left: 0,
      top: this.calculateFixedHeadersHeight(this.state.cells),
      right: 0,
      bottom: this.calculateFixedFootersHeight(this.state.cells),
    }

    const contentStyle: CSSProperties = {
      position: 'absolute',
      width: (this.props.estimatedColumnWidth || 0) * this.props.columnCount,
      height: (this.props.estimatedRowHeight || 0) * this.props.rowCount,
      left: -this.fixedLeftColumnsWidth,
      top: -this.calculateFixedHeadersHeight(this.state.cells),
      ...this.styles.translatedPane,
    }

    const fromRow = this.state.cells.rows.length
      ? this.state.cells.rows[0][0]
      : null
    const toRow = this.state.cells.rows.length
      ? this.state.cells.rows[this.state.cells.rows.length - 1][0]
      : null

    const fromColumn = this.state.cells.columns.length
      ? this.state.cells.columns[0][0]
      : null
    const toColumn = this.state.cells.columns.length
      ? this.state.cells.columns[this.state.cells.columns.length - 1][0]
      : null

    return (
      <div
        ref={this.bindCenterPaneBody}
        className={cx('center-pane-body')}
        style={attrs}
        key="grid-center-pane-body"
      >
        <div style={contentStyle} key="grid-center-pane-body-content">
          {this.renderCellRange(
            'center-pane-body',
            fromRow,
            toRow,
            fromColumn,
            toColumn,
            this.state.cells.rows,
            this.state.cells.columns
          )}
        </div>
      </div>
    )
  }

  renderColumnResizeGuide() {
    if (this._resizingColumn == null) {
      return null
    }

    const column = this.state.cells.columns.find((cell: number[]) => {
      return cell[0] === this._resizingColumn
    })

    const guideStyle = {
      ...this.styles.columnResizeGuide,
      left: column[1] + column[2],
      top: this._centerPaneBody.offsetTop - 1,
    }

    return <div style={guideStyle} key="grid-column-resize-guide" />
  }

  renderRowResizeGuide() {
    if (this._resizingRow == null) {
      return null
    }

    const row = this.state.cells.rows.find((cell: number[]) => {
      return cell[0] === this._resizingRow
    })

    const guideStyle = {
      ...this.styles.rowResizeGuide,
      top: row[1] + row[2] - 1,
      left: this._leftPane.offsetWidth,
    }

    return <div style={guideStyle} key="grid-row-resize-guide" />
  }

  get isScrolling() {
    return this._scrolling
  }

  calculateScrollableWidth(
    arg: { estimatedColumnWidth: number; columnCount: number },
    cells: { columns: Array<Array<number>> }
  ) {
    if (!cells || !cells.columns.length) {
      return arg.estimatedColumnWidth * arg.columnCount
    }

    const lastColumn = cells.columns[cells.columns.length - 1]
    const width = lastColumn[1] + lastColumn[2]

    return (
      width + (arg.columnCount - 1 - lastColumn[0]) * arg.estimatedColumnWidth
    )
  }

  calculateScrollableHeight(
    arg: { estimatedRowHeight: number; rowCount: number },
    cells: { rows: Array<Array<number>> }
  ) {
    if (!cells || !cells.rows.length) {
      return arg.estimatedRowHeight * arg.rowCount
    }

    const lastRow = cells.rows[cells.rows.length - 1]
    const height = lastRow[1] + lastRow[2]

    return height + (arg.rowCount - 1 - lastRow[0]) * arg.estimatedRowHeight
  }

  calculateFixedHeadersHeight(cells: { topLeftRows: Array<Array<number>> }) {
    if (!cells || !cells.topLeftRows.length) {
      return 0
    }

    const lastTopLeftRow = cells.topLeftRows[cells.topLeftRows.length - 1]
    const topOffset = lastTopLeftRow[1] + lastTopLeftRow[2]

    return topOffset
  }

  calculateFixedFootersHeight(cells: { bottomLeftRows: Array<Array<number>> }) {
    if (!cells || !cells.bottomLeftRows.length) {
      return 0
    }

    const lastBottomRow = cells.bottomLeftRows[cells.bottomLeftRows.length - 1]
    const lastBottomRowTop = lastBottomRow[1] + lastBottomRow[2]

    return lastBottomRowTop
  }

  get fixedRightColumnsWidth() {
    if (!this.state.cells || this.state.cells.rightColumns.length === 0) {
      return 0
    }

    const lastColumn = this.state.cells.rightColumns[
      this.state.cells.rightColumns.length - 1
    ]
    const lastOffset = lastColumn[1] + lastColumn[2]

    return lastOffset
  }

  get fixedLeftColumnsWidth() {
    if (!this.state.cells || !this.state.cells.leftColumns.length) {
      return 0
    }

    const lastColumn = this.state.cells.leftColumns[
      this.state.cells.leftColumns.length - 1
    ]
    const lastOffset = lastColumn[1] + lastColumn[2]

    return lastOffset
  }

  bindRoot = (node: HTMLDivElement) => {
    this._root = node
  }
  bindScrollOverlay = (node: HTMLDivElement) => {
    this._scrollOverlay = node
  }
  bindScrollInner = (node: HTMLDivElement) => {
    this._scrollInner = node
  }
  bindLeftPane = (node: HTMLDivElement) => {
    this._leftPane = node
  }
  bindLeftPaneHeader = (node: HTMLDivElement) => {
    this._leftPaneHeader = node
  }
  bindLeftPaneFooter = (node: HTMLDivElement) => {
    this._leftPaneFooter = node
  }
  bindLeftPaneBody = (node: HTMLDivElement) => {
    this._leftPaneBody = node
  }
  bindRightPane = (node: HTMLDivElement) => {
    this._rightPane = node
  }
  bindRightPaneHeader = (node: HTMLDivElement) => {
    this._rightPaneHeader = node
  }
  bindRightPaneFooter = (node: HTMLDivElement) => {
    this._rightPaneFooter = node
  }
  bindRightPaneBody = (node: HTMLDivElement) => {
    this._rightPaneBody = node
  }
  bindCenterPane = (node: HTMLDivElement) => {
    this._centerPane = node
  }
  bindCenterPaneHeader = (node: HTMLDivElement) => {
    this._centerPaneHeader = node
  }
  bindCenterPaneFooter = (node: HTMLDivElement) => {
    this._centerPaneFooter = node
  }
  bindCenterPaneBody = (node: HTMLDivElement) => {
    this._centerPaneBody = node
  }

  handleResize = () => {
    this.update(this.scrollTop, this.scrollLeft)
  }

  handleScroll = () => {
    this.update(this.scrollTop, this.scrollLeft)

    if (this.props.onScroll) {
      this.props.onScroll(this)
    }
  }

  handleScrollStart = () => {
    this._scrolling = true

    if (this.props.onScrollStart) {
      this.props.onScrollStart(this)
    }
  }

  handleScrollEnd = () => {
    this._scrolling = false

    if (this.props.onScrollEnd) {
      this.props.onScrollEnd(this)
    }
  }

  handleColumnResizeStart = (column: number, width: number) => {
    this._resizingColumn = column

    // this._pinnedColumnWidths[column] = Math.min(10000, Math.max(20, width));
    this.invalidateSizes()
    this.refresh()
  }

  handleColumnResize = (column: number, width: number) => {
    this._pinnedColumnWidths[column] = Math.min(10000, Math.max(20, width))
    this.invalidateSizes()
    this.refresh()
  }

  handleColumnResizeEnd = () => {
    this._resizingColumn = null

    this.invalidateSizes()
    this.refresh()
  }

  handleRowResizeStart = (row: number, height: number) => {
    this._resizingRow = row

    // this._pinnedRowHeights[row] = Math.min(10000, Math.max(20, height));
    this.invalidateSizes()
    this.refresh()
  }

  handleRowResize = (row: number, height: number) => {
    this._pinnedRowHeights[row] = Math.min(10000, Math.max(20, height))
    this.invalidateSizes()
    this.refresh()
  }

  handleRowResizeEnd = () => {
    this._resizingRow = null

    this.invalidateSizes()
    this.refresh()
  }

  invalidateSizes() {
    this.calculator.invalidate()
  }

  refresh = (force?: boolean, props?: Props) => {
    this.update(this.scrollTop, this.scrollLeft, force, props || this.props)
  }

  update(
    scrollTop: number,
    scrollLeft: number,
    force?: boolean,
    props?: Props
  ) {
    if (!this._root) {
      return
    }

    const properties: Props = props || this.props

    const x = scrollLeft - (properties.preloadPixelsX || 0)
    const y = scrollTop - (properties.preloadPixelsY || 0)

    const bounds = {
      left: Math.max(0, x),
      top: Math.max(0, y),
      width:
        this._root.clientWidth +
        2 * (properties.preloadPixelsX || 1) +
        (x < 0 ? x : 0),
      height:
        this._root.clientHeight +
        2 * (properties.preloadPixelsY || 1) +
        (y < 0 ? y : 0),
    }

    const cells = this.calculator.cellsWithinBounds(
      bounds,
      properties.rowCount,
      properties.columnCount
    )

    if (cells.changed || force) {
      const fromRow = cells.rows.length ? cells.rows[0][0] : null
      const toRow = cells.rows.length
        ? cells.rows[cells.rows.length - 1][0]
        : null
      const fromColumn = cells.columns.length ? cells.columns[0][0] : null
      const toColumn = cells.columns.length
        ? cells.columns[cells.columns.length - 1][0]
        : null

      if (properties.onExtentsChange) {
        properties.onExtentsChange(fromRow, toRow, fromColumn, toColumn)
      }

      this.setState({ cells: cells })
    }

    if (cells) {
      this.setScroll(scrollLeft, scrollTop, cells)
    }

    const scrollableWidth = this.calculateScrollableWidth(
      {
        estimatedColumnWidth: properties.estimatedColumnWidth || 0,
        columnCount: properties.columnCount,
      },
      cells
    )
    const scrollableHeight = this.calculateScrollableHeight(
      {
        estimatedRowHeight: properties.estimatedRowHeight || 0,
        rowCount: properties.rowCount,
      },
      cells
    )

    // if the srollable width or height changes, refresh the scroller
    if (
      force ||
      this._lastScrollableWidth !== scrollableWidth ||
      this._lastScrollableHeight !== scrollableHeight
    ) {
      this._lastScrollableWidth = scrollableWidth
      this._lastScrollableHeight = scrollableHeight

      // if there were no cells, there might be more cells above. This handles a case where the table renders at a scroll
      // offset with no data. For example, scroll down in a huge list of a results, then filter it to only a few results.
      // The scroll view is left at a large offset but there's no data. Because we don't know how far we'd have to move
      // up to find data, the simplest thing to do is to go to position 0, 0.
      const diffY = Math.max(
        0,
        scrollTop +
          this._root.clientHeight -
          Math.max(this._root.clientHeight, scrollableHeight)
      )
      const diffX = Math.max(
        0,
        scrollLeft +
          this._root.clientWidth -
          Math.max(this._root.clientWidth, scrollableWidth)
      )

      setTimeout(() => {
        if (diffY > 0 || diffX > 0) {
          const updatedScrollLeft = scrollLeft - diffX
          const updatedScrollTop = scrollTop - diffY

          this._scroller.scrollTo(-updatedScrollLeft, -updatedScrollTop)
          this.update(updatedScrollTop, updatedScrollLeft)
        }

        this._scroller.refresh()
      }, 1)
    }
  }

  setScroll(x: number, y: number, cells: { topLeftRows: number[][] }) {
    const fixedHeadersHeight = this.calculateFixedHeadersHeight(cells)

    if (this._leftPaneBody) {
      this._leftPaneBody.childNodes[0].style.top =
        -y - fixedHeadersHeight + 'px'
    }

    if (this._rightPaneBody) {
      this._rightPaneBody.childNodes[0].style.top =
        -y - fixedHeadersHeight + 'px'
    }

    if (this._centerPaneHeader) {
      this._centerPaneHeader.childNodes[0].style.left =
        -x - this.fixedLeftColumnsWidth + 'px'
    }

    if (this._centerPaneFooter) {
      this._centerPaneFooter.childNodes[0].style.left =
        -x - this.fixedLeftColumnsWidth + 'px'
    }

    if (this._centerPaneBody) {
      this._centerPaneBody.childNodes[0].style.top =
        -y - fixedHeadersHeight + 'px'
      this._centerPaneBody.childNodes[0].style.left =
        -x - this.fixedLeftColumnsWidth + 'px'
    }

    if (this._leftPane) {
      this._leftPane.style.left = x + 'px'
      this._leftPane.style.top = y + 'px'
      this._leftPane.style.height = this._scrollOverlay.offsetHeight + 'px'
    }

    if (this._rightPane) {
      this._rightPane.style.left =
        x + this._scrollOverlay.offsetWidth - this.fixedRightColumnsWidth + 'px'
      this._rightPane.style.top = y + 'px'
      this._rightPane.style.height = this._scrollOverlay.offsetHeight + 'px'
    }

    if (this._centerPane) {
      this._centerPane.style.left = x + this.fixedLeftColumnsWidth + 'px'
      this._centerPane.style.top = y + 'px'
      this._centerPane.style.height = this._scrollOverlay.offsetHeight + 'px'
      this._centerPane.style.width =
        this._scrollOverlay.offsetWidth -
        this.fixedRightColumnsWidth -
        this.fixedLeftColumnsWidth +
        'px'
    }

    if (this._scrollInner) {
      if (
        this._scrollInner.childNodes[0].offsetHeight <
        this._scrollInner.offsetHeight
      ) {
        this._scrollInner.childNodes[0].style.height =
          this._scrollInner.offsetHeight + 'px'
      }

      if (
        this._scrollInner.childNodes[0].offsetWidth <
        this._scrollInner.offsetWidth
      ) {
        this._scrollInner.childNodes[0].style.width =
          this._scrollInner.offsetWidth + 'px'
      }
    }
  }

  get calculator() {
    if (!this._calculator) {
      this._calculator = new GridCalculator()
      this._calculator.estimatedColumnWidth = this.props.estimatedColumnWidth
      this._calculator.estimatedRowHeight = this.props.estimatedRowHeight
      this._calculator.fixedLeftColumnCount = this.props.fixedLeftColumnCount
      this._calculator.fixedRightColumnCount = this.props.fixedRightColumnCount
      this._calculator.fixedHeaderCount = this.props.fixedHeaderCount
      this._calculator.fixedFooterCount = this.props.fixedFooterCount
      this._calculator.calculateRowHeight = this.calculateRowHeight
      this._calculator.calculateColumnWidth = this.calculateColumnWidth
    }

    return this._calculator
  }

  calculateRowHeight = (row: number) => {
    if (this._pinnedRowHeights[row] != null) {
      return this._pinnedRowHeights[row]
    }

    return this.props.rowHeight(row)
  }

  calculateColumnWidth = (column: number) => {
    if (this._pinnedColumnWidths[column] != null) {
      return this._pinnedColumnWidths[column]
    }

    return this.props.columnWidth(column)
  }

  clearPinnedWidths() {
    this._pinnedColumnWidths = {}
  }

  clearPinnedWidth(columnIndex: number) {
    delete this._pinnedColumnWidths[columnIndex]
  }

  clearPinnedHeights() {
    this._pinnedRowHeights = {}
  }

  clearPinnedHeight(rowIndex: number) {
    delete this._pinnedRowHeights[rowIndex]
  }

  renderRow = (pane, cells, rowData, columnRange) => {
    const [rowIndex, rowTop, height] = rowData

    const rowStyle: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: rowTop,
      height: height,
    }

    const renderCells = this.props.renderCells || this.renderCells

    return (
      <div key={'row-' + rowIndex} style={rowStyle}>
        {renderCells(cells)}
      </div>
    )
  }

  renderCells(cells) {
    return cells
  }

  renderRows(rows) {
    return rows
  }

  renderCellRange(
    pane,
    fromRow: number,
    toRow: number,
    fromColumn: number,
    toColumn: number,
    rows,
    columns
  ) {
    const rowRange = []

    const renderCell = this.props.renderCell
    const renderRow = this.props.renderRow || this.renderRow
    const renderRows = this.props.renderRows || this.renderRows

    for (
      let row = toRow, visibleRowIndex = 0;
      row >= fromRow;
      --row, ++visibleRowIndex
    ) {
      const rowCells = []
      const rowData = rows[row - fromRow]
      const columnRange = []

      for (
        let column = toColumn, visibleColumnIndex = 0;
        column >= fromColumn;
        --column, ++visibleColumnIndex
      ) {
        const columnData = columns[column - fromColumn]

        columnRange.push(columnData)

        rowCells.push(
          renderCell(
            pane,
            row,
            rowData,
            column,
            columnData,
            this,
            visibleRowIndex,
            visibleColumnIndex
          )
        )
      }

      rowRange.push(renderRow(pane, rowCells, rowData, columnRange))
    }

    return renderRows(rowRange)
  }

  get scrollTop() {
    return -this._scroller.y
  }

  get scrollLeft() {
    return -this._scroller.x
  }
}
