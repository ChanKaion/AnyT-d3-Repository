# Force Circular Sector

## Introduction
该项目为“扇形布局约束力模型” 项目, 基于 `d3-force` 实现了扇形布局的力模型，使得 `simulation` 在迭代过程中可以对节点坐标进行约束计算，以达到扇形布局效果。

<img alt="Force Circular Sector" src="https://github.com/ChanKaion/AnyT-d3-Repository/blob/static-files/img/Force%20Circular%20Sector.jpg?raw=true" width="720">

## Project Resources

- *src*：静态资源文件目录
    - `d3-v6.7.0.min.js`：d3.js 资源文件
    - `forceCircularSector.js`：扇形布局约束力
    - `index.js`：资源调用入口
- `index.html`：主页面

## Usage

`d3.forceCircularSector()` 在 `d3-force` API 基础上进行实现，因此可以直接通过 `d3` 进行调用，下面是一个简单的使用示例：
```html
<script src="https://d3js.org/d3.v6.min.js"></script>
<script src="forceCircularSector.js"></script>
<script>

let simulation = d3.forceSimulation(nodes)
    .force('forceCircularSector', d3.forceCircularSector([100, 500]).angles([15, 60]).strength(0.3));

</script>
```

## API Reference

- d3.**forceCircularSector**(*radiuses* [, *angles*])

根据 *radiuses* 指定的半径范围创建一个新的扇形布局约束力，布局的扇形角度为 *angles* 指定的范围。如果 *angles* 尚未指定，则采用默认值 [0, 360]。

- *circularSector*.**strength**([*strength*])

设置力模型的强度系数，可接收数字或函数参数值，强度将会影响节点在 x 和 y 方向速度的增量多少。比如，将强度设置为 0.1，则表示节点在每步迭代过程中将从当前位置向目标位置移动十分之一的距离。强度参数值的建议范围为 [0,1] ，如果尚未指定值，则采用默认值 0.1 。

- *circularSector*.**radiuses**([*radiuses*])

设置扇形布局的内外半径范围，接收一个两元组参数值。

- *circularSector*.**angles**([*angles*])

设置扇形布局的起始终止角度范围，接收一个两元组参数值。

## Change Log

### 2021-11-20

#### Added

- 初始化 “扇形布局约束力模型” 项目，对其进行配置与发布
 