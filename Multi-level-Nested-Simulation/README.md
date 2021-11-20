# Multi-level Nested Simulation

## Introduction
该项目为 “多级嵌套力模拟器布局优化” 项目, 通过对 `d3-force` 中的 `simulation` 进行多级嵌套，以支持力模拟器迭代过程中的定制化布局。

<img alt="Multi-level Nested Simulation" src="https://github.com/ChanKaion/AnyT-d3-Repository/blob/static-files/img/Multi-level%20Nested%20Simulation.jpg?raw=true" width="720">

## Project Resources

- *src*：静态资源文件目录
    - `d3-v6.7.0.min.js`：d3.js 资源文件
    - `index.js`：资源调用入口
- `index.html`：主页面

## Core Design

多级嵌套力模型器布局优化实现核心思路是：在父层 `simulation` 的 `tick` 调度函数中添加新的子 `simulation` ，并设置相应数据以及力参数，从而对特定数据施加不同作用力，以实现定制化布局。

下面是一个简单的示例：
```html
<script src="https://d3js.org/d3.v6.min.js"></script>
<script>

let simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-30))
    .force('link', d3.forceLink(edges).id(d => d.guid))
    .on('tick', () => {
        let sim = d3.forceSimulation(subNodes)
            .force('radial', d3.forceRadial(20));
        
        moveNode();
        moveLink();
    })

   
</script>
```

## Change Log

### 2021-11-20

#### Added

- 初始化 “多级嵌套力模拟器布局优化” 项目，对其进行配置与发布
 