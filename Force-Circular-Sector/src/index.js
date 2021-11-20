/**
 * 初始化 SVG 画布元素
 * @returns {*} d3 SVG画布元素对象
 */
const initSVGSettings = () => {
    // 定义 svg 元素
    let width = document.documentElement.clientWidth,
        height = document.documentElement.clientHeight;
    let svgContainer = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    let renderSVG = svgContainer.append('g');

    // 事件绑定
    svgContainer
        // 放缩事件
        .call(
            d3.zoom()
                .scaleExtent([1 / 93, 114])
                .on('zoom', event => {
                    renderSVG.attr('transform', event.transform);
                })
        )
        // 阻止默认的双击放缩事件
        .on('dblclick.zoom', null);
    // 禁用浏览器原始右键菜单
    document.oncontextmenu = () => false;

    return renderSVG;
};

/**
 * 渲染图谱
 * @param renderSVG 渲染的SVG画布元素
 * @param renderParams 渲染参数对象，包括radius节点半径，nodeNum节点规模
 */
const renderGraph = (renderSVG, renderParams) => {
    // 图谱参数
    let radius = renderParams.radius, // 节点半径大小
        nodeNum = renderParams.nodeNum; // 节点数量
    // 构造节点数据
    let nodes = [];
    for (let index = 0; index < nodeNum; index++) {
        nodes.push({
            'guid': `index-${index}`
        })
    }

    // 绘制节点
    let nodesEL = renderSVG.selectAll("circle")
        .data(nodes, d => d.guid)
        .enter()
        .append('circle')
        .attr("r", radius)
        .attr("fill", '#999999');

    // 力模拟器
    let simulation = d3.forceSimulation();

    // 绑定节点交互事件
    nodesEL
        // 点击
        .on('click', (event, d) => {
            console.log('Node', d);
            event.stopPropagation();
        })
        // 拖拽
        .call(d3.drag()
            .on('start', (event) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on('drag', (event) => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on('end', (event) => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            })
        );

    // 力模拟器参数设置
    simulation
        // 绑定节点数据
        .nodes(nodes)
        // 设置扇形作用力，角度从顺时针开始计算
        .force('forceCircularSector', d3.forceCircularSector([100, 500]).angles([15, 60]).strength(0.3))
        // 设置碰撞力，以防止节点之间的重叠
        .force('collide', d3.forceCollide(radius * 2).strength(0.75).iterations(3))
        // tick 调度方法
        .on('tick', () => {
            nodesEL.attr('transform', d => `translate(${d.x},${d.y})`);
        })
        // tickend 方法
        .on('end', () => {
            console.log("tickend");
        });
};

// 初始化 SVG 画布元素
let renderSVG = initSVGSettings();
// 渲染图谱
renderGraph(renderSVG, renderParams = {radius: 3, nodeNum: 200});