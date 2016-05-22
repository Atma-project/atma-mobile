import io from 'socket.io-client'

export default class Socket {
    constructor() {

        // this.host = 'http://172.18.33.150:3000'
        this.host = 'http://192.168.1.84:3000'

        this.sending = false
        this.reference = null
        this.timer = null
        this.movementObject = {}
        this.rotationObject = {}
        this.difMovementObject = {}
        this.difRotationObject = {}
    }

    init() {
        this.socket = io(this.host)

        this.socket.on('newConnection', (data) => {
            this.socket.emit('mobile-connected', data)
        })

        this.socket.on('disconnect', (data) => {
            this.listening = false
            this.socket.emit('disconnect', data)
        })
    }

    listenDeviceMotion() {
        window.addEventListener('devicemotion', (event) => {
            this.movementObject = {
                'aX': event.acceleration.x,
                'aY': event.acceleration.y,
                'aZ': event.acceleration.z,

                'aGravityX': event.accelerationIncludingGravity.x,
                'aGravityY': event.accelerationIncludingGravity.y,
                'aGravityZ': event.accelerationIncludingGravity.z,
            }
            this.socket.emit('motion', this.movementObject)

            if(this.reference) {
                this.difMovementObject = {
                    daX: this.reference.ax - this.movementObject.aX,
                    daY: this.reference.ay - this.movementObject.aY,
                    daZ: this.reference.az - this.movementObject.aZ,
                    dgaY: this.reference.agy - this.movementObject.aGravityY
                }
                this.socket.emit('motion-dif', this.difMovementObject)
            }
        })
        window.addEventListener('deviceorientation', (event) => {
            console.log(event.alpha);
            this.rotationObject = {
                'alpha': event.alpha,
                'beta': event.beta,
                'gamma': event.gamma,
                'timeStamp': event.orientationTs
            }
            this.socket.emit('rotation', this.rotationObject)

            if(this.reference) {
                this.difRotationObject = {
                    da: this.reference.a - this.rotationObject.alpha,
                    db: this.reference.b - this.rotationObject.beta,
                    dg: this.reference.g - this.rotationObject.gamma,
                }
                this.socket.emit('rotation-dif', this.difRotationObject)
            }
        })
    }

    getReferencePosition() {
        this.timer = window.setInterval(() => {
            if(!this.reference) {
                if(this.movementObject.aGravityY < -9.0 && this.movementObject.aGravityZ < 1.5 && this.movementObject.aGravityX < 4.0) {
                    this.reference = {
                        ax: this.movementObject.aX,
                        ay: this.movementObject.aY,
                        az: this.movementObject.aZ,
                        agy: this.movementObject.aGravityY,
                        a: this.rotationObject.alpha,
                        b: this.rotationObject.beta,
                        g: this.rotationObject.gamma
                    }

                    this.socket.emit('referencePosition', this.reference)
                    this.stopReferencePosition()
                }
            }
        }, 3000)

    }

    stopReferencePosition() {
        console.log('clear')
        clearInterval(this.timer)
        this.timer = null
    }

    disconnect() {
        this.listening = false
        this.socket.emit('disconnect')
    }

    pauseGame() {
        this.socket.emit('game-paused')
    }

    activateCoach() {
        this.socket.emit('coach-acvtivated')
    }

    deactivateCoach() {
        this.socket.emit('coach-deactivated')
    }
}
