/**
 * 初始化 SVG 画布元素
 * renderParams 参数对象，包括 radius节点半径，svgWidth 渲染元素宽度和 svgHeight 渲染元素高度
 * @returns {*} d3 SVG画布元素对象
 */
const initSVGSettings = (renderParams) => {
    let {svgWidth, svgHeight} = renderParams;

    // 定义 svg 元素
    let svgContainer = d3.select('body')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('border', '1px solid #cccccc');
    let renderSVG = svgContainer.append('g');

    // 定义放缩函数对象
    let zoomObject = d3.zoom()
        .scaleExtent([1 / 93.0, 114.22])
        .on('zoom', event => {
            renderSVG.attr('transform', event.transform);
        });

    // 事件绑定
    svgContainer
        // 放缩事件
        .call(zoomObject)
        // 阻止默认的双击放缩事件
        .on('dblclick.zoom', null);
    // 禁用浏览器原始右键菜单
    document.oncontextmenu = () => false;

    return {renderSVG, zoomObject};
};

/**
 * 渲染图谱
 * @param renderSVG 渲染的SVG画布元素
 * @param renderParams 图谱参数对象，包括 radius节点半径，svgWidth 渲染元素宽度和 svgHeight 渲染元素高度
 */
const renderGraph = (renderSVG, renderParams) => {
    // 图谱参数
    let {radius, svgWidth, svgHeight, zoomObject, margin} = renderParams;
    // 图谱实例对象
    let graphInstance = {};

    d3.json('./dataset/miserables.json').then(data => {
        // 设置 SVG 渲染容器和点边数据
        graphInstance.containerEL = renderSVG;
        graphInstance.nodes = [...data.nodes];
        graphInstance.edges = [...data.edges];

        // 绘制点边
        renderEdges(graphInstance, true);
        renderNodes(graphInstance, true);

        // 设置力模拟器
        graphInstance.simulation = d3.forceSimulation();
        graphInstance.simulation
            .nodes(graphInstance.nodes)
            .force('charge', d3.forceManyBody().strength(-50))
            .force('link', d3.forceLink(graphInstance.edges).id(d => d.id))
            .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
            .on('tick', () => {
                // 当迭代基本稳定时触发自动放缩
                if (graphInstance.simulation.alpha() < 0.10) {
                    autoZoom(margin);
                    graphInstance.simulation.stop();
                }
                graphInstance.nodesEL
                    .attr('transform', d => `translate(${d.x},${d.y})`);
                graphInstance.edgesEL
                    .selectAll('path')
                    .attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
            })
            .on('end', () => {
                console.log("tickend");
            });

        d3.select('#auto-zoom').on('click', () => {
            autoZoom(margin);
        });

        /**
         * 绘制连边
         * @param graphInstance 图谱实例对象
         */
        function renderEdges(graphInstance) {
            let containerEl = graphInstance.containerEL
                .append('g')
                .attr('class', 'linksG');

            graphInstance.edgesEL = containerEl
                .selectAll('g')
                .data(graphInstance.edges, d => d.id)
                .enter()
                .append('g')
                .attr('id', d => `linkG-${d.id}`)
                .attr('class', 'linkG');
            const paths = graphInstance.edgesEL
                .append('path')
                .attr('stroke', '#999999')
                .style('stroke-width', 0.75);
        }

        /**
         * 绘制节点
         * @param graphInstance 图谱实例对象
         */
        function renderNodes(graphInstance) {
            let containerEl = graphInstance.containerEL
                .append('g')
                .attr('class', 'nodesG');

            graphInstance.nodesEL = containerEl
                .selectAll('g')
                .data(graphInstance.nodes, d => d.id)
                .enter()
                .append('g')
                .attr('id', d => `nodeG-${d.id}`)
                .attr('class', 'nodeG');
            graphInstance.nodesEL
                .append('circle')
                .attr('stroke', '#ffffff')
                .attr('r', radius)
                .style('fill', '#999999');
        }

        /**
         * 对视图自动放缩聚焦
         * @param margin 视图边距 padding
         */
        function autoZoom(margin) {
            // 获取 svg 图谱元素的空间范围
            const svgBox = renderSVG.node().getBBox();

            // 计算放缩系数
            const scale = Math.min(
                ((svgHeight - 2 * margin.top) / svgBox.height),
                ((svgWidth - 2 * margin.left) / svgBox.width)
            );

            // 计算居中的位置偏量
            const xScale = svgWidth / 2 - (svgBox.x + svgBox.width / 2) * scale;
            const yScale = svgHeight / 2 - (svgBox.y + svgBox.height / 2) * scale;

            // 对绑定了放缩事件的元素进行放缩操作（即 renderSVG 的父元素）
            const t = d3.zoomIdentity.translate(xScale, yScale).scale(scale);
            d3.select(renderSVG.node().parentNode).transition().duration(700).call(zoomObject.transform, t);

        }
    });
};

// 初始化 SVG 画布元素
let renderParams = {
    radius: 4.5,
    svgWidth: 960,
    svgHeight: 600,
    margin: {top: 60, left: 60} // 视图内边距（主要用于自动放缩场景）
};
let {renderSVG, zoomObject} = initSVGSettings(renderParams);
// 设置放缩对象
renderParams.zoomObject = zoomObject;
// 渲染图谱
renderGraph(renderSVG, renderParams);