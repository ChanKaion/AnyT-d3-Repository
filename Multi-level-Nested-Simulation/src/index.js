/**
 * 初始化 SVG 画布元素
 * @returns {*} d3 SVG画布元素对象
 */
const initSVGSettings = (renderParams) => {
    // 定义 svg 元素
    let {svgWidth, svgHeight} = renderParams;
    let svgContainer = d3.select('body')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);
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
    let {radius, svgWidth, svgHeight} = renderParams;

    d3.json('./dataset/case.json').then(data => {

        // 获取簇结构数据
        let clusterGroup = data.nodes.filter(d => d.isCluster);
        let nodeMap = new Map();
        data.nodes.forEach(d => {
            nodeMap.set(d.guid, d);
        });
        clusterGroup.forEach(d => {
            d.clusterNodes = d.domainNodes.map(t => nodeMap.get(t));
        });

        // 绘制点边
        let edgesEl = renderSVG.append('g')
            .attr('class', 'linksG')
            .selectAll('g')
            .data(data.edges, d => d.guid)
            .enter()
            .append('g')
            .attr('class', 'linkG')
            .attr('id', d => `linkG-${d.guid}`);
        edgesEl
            .append('path')
            .attr('stroke', '#999999')
            .style('stroke-width', 0.75);
        let nodesEL = renderSVG.append('g')
            .attr('class', 'nodesG')
            .selectAll('g')
            .data(data.nodes, d => d.guid)
            .enter()
            .append('g')
            .attr('id', d => `nodeG-${d.guid}`)
            .attr('class', 'nodeG');
        nodesEL
            .append('circle')
            .attr('stroke', '#ffffff')
            .attr('r', radius)
            .style('fill', '#999999');

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
            .nodes(data.nodes)
            .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
            .force('charge', d3.forceManyBody().strength(-25))
            .force('link', d3.forceLink(data.edges).id(d => d.guid))
            .force('collide', d3.forceCollide(radius * 2).strength(0.75).iterations(3))
            .on('tick', () => {
                // 对一度邻居节点添加同心环形力
                clusterGroup.forEach(d => {
                    addRadialForce(d.clusterNodes, d);
                });

                nodesEL
                    .attr('transform', d => `translate(${d.x},${d.y})`);
                edgesEl
                    .selectAll('path')
                    .attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
            })
            .on('end', () => {
                console.log("tickend");
            });

        /**
         * 给簇结构中簇节点添加同心环形力
         * @param clusterNodes 簇节点
         * @param clusterCenterNode 簇中心节点
         */
        function addRadialForce(clusterNodes, clusterCenterNode) {
            // 环分组
            function groupCut(array) {
                var subGroupLength, index = 0;
                var newArray = [];

                // 节点数小于20则直接返回一个圆，否则为3层圆
                subGroupLength = array.length <= 20 ? array.length : Math.floor(array.length / 3);
                while (index < array.length) {
                    newArray.push(array.slice(index, index += subGroupLength));
                    subGroupLength += subGroupLength
                }

                return newArray;
            }

            groupCut(clusterNodes).forEach((dArray, index) => {
                var subSimulation = d3.forceSimulation();
                var r = dArray.length === clusterNodes.length ? radius * 8 : radius * 12 * (1 + index);
                subSimulation.nodes(dArray)
                    .force('radial', d3.forceRadial(r).x(clusterCenterNode.x).y(clusterCenterNode.y))
                    .force("center", d3.forceCenter(clusterCenterNode.x, clusterCenterNode.y))
            })
        }
    })
};

// 初始化 SVG 画布元素
let renderParams = {
    radius: 3,
    svgWidth: document.documentElement.clientWidth,
    svgHeight: document.documentElement.clientHeight
};
let renderSVG = initSVGSettings(renderParams);
// 渲染图谱
renderGraph(renderSVG, renderParams);