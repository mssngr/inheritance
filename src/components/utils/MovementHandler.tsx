import React from 'react'
import { forEach } from 'lodash'
import keyMirror from 'keymirror'
import { TweenLite } from 'gsap'

/* TYPES */
interface OffsetState {
  x: number
  y: number
}

interface HomeState {
  offset: OffsetState
  isMoving: {
    [key: string]: boolean
  }
}

/* UTILS */
const directions: { [key: string]: string } = keyMirror({
  UP: null,
  LEFT: null,
  DOWN: null,
  RIGHT: null,
})

/* PRESENTATION */
export default class Home extends React.Component<
  { tileSize: number; children: (arg: OffsetState) => any },
  HomeState
> {
  render() {
    return this.props.children(this.state.offset)
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
            const canMoveUp =
              -this.offsetY.y >
                this.props.tileSize * 10 + this.props.tileSize ||
              -this.offsetX.x >
                this.props.tileSize * 10 + this.props.tileSize ||
              -this.offsetX.x < this.props.tileSize * 10 - this.props.tileSize
            if (canMoveUp) {
              TweenLite.to(this.offsetY, 0.1, {
                y: this.state.offset.y + 10,
                onUpdate: () => {
                  this.setState({
                    offset: { ...this.state.offset, y: this.offsetY.y },
                  })
                },
              })
            }
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
