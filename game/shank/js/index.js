
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#000' // 填充样式
ctx.strokeStyle = '#000' // 边框样式
const cav_width = 900 // 画布宽
const cav_height = 700 // 画布高
const grid_width = 10 // 网格宽度 & 蛇身宽高
const game_audio = new Audio('./audio/12240.mp3') // 游戏背景音
const game_end = new Audio('./audio/3139.mp3') // 游戏结束声
const game_each = new Audio('./audio/13148.mp3') // 吃到食物声
let point = [] // 食物坐标
let game_status = 0 // 0 未开始 1 游戏中 2 暂停中 3&4 已结束
let foot_length = 1 // 食物数量
let timer = null // 游戏定时器
let speed = 150 // 游戏速度
game_audio.loop = true // 背景音乐循环

const write_gridding = () => { // 绘制网格
  for (let i = 0; i < cav_width; i += 10) {
    ctx.lineWidth = 0.5
    // 绘制y轴线条
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, cav_width)
    ctx.closePath()
    ctx.stroke()
    // 绘制x轴线条
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(cav_width, i)
    ctx.closePath()
    ctx.stroke()
  }
}

const getPoint = () => { // 获取食物坐标
  const i = foot_length - point.length
  if (i) {
    Array(i).fill(null).forEach(item => {
      const px = {
        x: Math.floor(Math.random() * (cav_width / grid_width)) * grid_width,
        y: Math.floor(Math.random() * (cav_height / grid_width)) * grid_width
      }
      point.push(px)
    })
  }
}

const setPoint = () => { // 绘制食物
  ctx.fillStyle = 'greenyellow'
  ctx.beginPath()
  point.forEach(item => {
    ctx.fillRect(item.x, item.y, grid_width, grid_width)
  })
  ctx.closePath()
}

class Snake { // 创建一个蛇类
  constructor() {
    this.direction = ['left', 'right', 'top', 'bottom'] // 可变的方向
    this.no_rever_direction = [['left', 'right'], ['top', 'bottom']] // 不可逆方向
  }

  init() { // 初始化
    this.snake_coordinates = [{ x: 20, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }] // 蛇初始化坐标
    speed = 150 // 游戏速度
    foot_length = 1
    point = []
    this.currOri = 'right' // 当前方向
    return this
  }

  create() { // 绘制蛇
    ctx.fillStyle = 'orange'
    ctx.beginPath()
    ctx.arc(this.snake_coordinates[0].x + grid_width / 2, this.snake_coordinates[0].y + grid_width / 2, grid_width / 2, 0, 360 * (Math.PI / 180))
    this.snake_coordinates.slice(1).forEach(item => {
      // ctx.arc(item.x + grid_width / 2, item.y + grid_width / 2, grid_width / 2, 0, 360 * (Math.PI / 180))  // 圆形身体
      ctx.fillRect(item.x, item.y, grid_width, grid_width)  // 方形身体
    })
    ctx.closePath()
    ctx.fill()
  }

  isWall() { // 判断是否结束游戏
    // 判断是否撞墙
    const first = this.snake_coordinates[0]
    const condition = [first.x < 0, first.x >= cav_width, first.y < 0, first.y >= cav_height]
    if (condition.some(item => item)) {
      document.getElementById('operation').innerText = '重新开始'
      game_status = 3
      game_audio.pause()
      game_end.play()
      clearInterval(timer)
    }
    // 判断是否撞到自己
    const last = this.snake_coordinates[this.snake_coordinates.length - 1]
    for (let i = 1; i < this.snake_coordinates.length - 1; i++) {
      if (first.x === this.snake_coordinates[i].x && first.y === this.snake_coordinates[i].y) {
        document.getElementById('operation').innerText = '重新开始'
        game_status = 4
        game_audio.pause()
        game_end.play()
        clearInterval(timer)
        break;
      }
    }
  }

  eat_point() { // 判断蛇是否吃到食物
    const index = point.findIndex(item => this.snake_coordinates[0].x === item.x && this.snake_coordinates[0].y === item.y)
    if (index !== -1) {
      this.add() // 添加身体
      game_each.play()
      ++document.getElementById('grade').innerHTML // 记录分数
      const grade = document.getElementById('grade').innerText
      foot_length = Math.ceil(grade / 10)
      point[index].x = Math.floor(Math.random() * (cav_width / grid_width)) * grid_width
      point[index].y = Math.floor(Math.random() * (cav_height / grid_width)) * grid_width
      if (speed > 50) {
        speed--
        start()
      }
    }
  }

  add() { // 添加身体
    const last_snake = this.snake_coordinates[this.snake_coordinates.length - 1] // 倒数第一个身体
    const last_two_snake = this.snake_coordinates[this.snake_coordinates.length - 1] // 倒数第二个身体
    const x = last_snake.x - last_two_snake.x
    const y = last_snake.y - last_two_snake.y
    this.snake_coordinates.push(last_snake.x + x, last_snake.y + y)
  }

  move(pre) { // 蛇移动
    let tmp;
    for (let i = 1; i < this.snake_coordinates.length; i++) { //遍历每一个身体节点
      tmp = this.snake_coordinates[i];
      this.snake_coordinates[i] = pre;
      pre = tmp;
    } //并且把每个节点的左边变化成前一个节点的坐标，达到依次向前的目的
  }

  changeOri(ori) { // 改变方向
    if (ori === this.currOri) return // 如果要改变的方向和当前方向相同，则不操作
    if (!this.direction.includes(ori)) return // 判断要改变的方向是否合法
    if (!this.is_rever(ori)) return
    this.currOri = ori
  }

  is_rever(ori) { // 判断方向是否为不可逆方向
    const oris = this.no_rever_direction.find(item => item.includes(ori))
    if (!oris.length) return true
    if (oris.includes(ori) && oris.includes(this.currOri)) return false
    return true
  }

  right() { // 右移动
    const pre = this.snake_coordinates[0]
    this.snake_coordinates[0] = { x: pre.x + grid_width, y: pre.y }
    this.move(pre)
  }

  bottom() { // 下移动
    const pre = this.snake_coordinates[0]
    this.snake_coordinates[0] = { x: pre.x, y: pre.y + grid_width }
    this.move(pre)
  }

  left() { // 左移动
    const pre = this.snake_coordinates[0]
    this.snake_coordinates[0] = { x: pre.x - grid_width, y: pre.y }
    this.move(pre)
  }

  top() { // 上移动
    const pre = this.snake_coordinates[0]
    this.snake_coordinates[0] = { x: pre.x, y: pre.y - grid_width }
    this.move(pre)
  }

}

const o_snake = new Snake() // 蛇实例
write_gridding() // 画轴
o_snake.init().create() // 画蛇


//键盘监听
window.onkeyup = function (e) {
  let ori;
  switch (e.keyCode) {
    case 37:
      ori = 'left'
      break;
    case 39:
      ori = 'right'
      break;
    case 38:
      ori = 'top'
      break;
    case 40:
      ori = 'bottom'
      break;
  }
  o_snake.changeOri(ori)
}


function start() { // 开始游戏
  clearInterval(timer)
  timer = setInterval(() => { // 游戏主循环
    const status_text = {
      0: '进行中',
      1: '游戏中',
      2: '暂停中',
      3: '游戏结束(撞墙)',
      4: '游戏结束(撞到自己)',
    }
    eval('o_snake.' + o_snake.currOri + '()')
    ctx.clearRect(0, 0, cav_width, cav_height); // 清屏
    write_gridding() // 画轴
    o_snake.create() // 画蛇
    getPoint() // 获取食物坐标
    setPoint() // 画食物
    o_snake.eat_point() // 处理蛇吃到食物
    o_snake.isWall() // 处理游戏结束
    document.getElementById('status').innerText = status_text[game_status] // 设置游戏状态
  }, speed)
}

document.getElementById('operation').onclick = function () { // 控制游戏开始和暂停
  if (game_status === 1) {
    game_status = 2
    document.getElementById('status').innerText = '暂停中' // 因为有150的延迟所以手动设置
    clearInterval(timer)
    game_audio.pause()
    this.innerHTML = '继续'
    return
  } else if (game_status === 0) {
    this.innerHTML === '开始游戏'
  } else if (game_status === 3 || game_status === 4) {
    o_snake.init()
    document.getElementById('grade').innerText = '0'
  }
  game_status = 1
  game_audio.play()
  start()
  this.innerHTML = '暂停'
}
