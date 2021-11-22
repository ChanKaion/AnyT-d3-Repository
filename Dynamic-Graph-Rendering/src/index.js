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

    // 事件绑定
    svgContainer
        // 放缩事件
        .call(
            d3.zoom()
                .scaleExtent([1 / 93.0, 114.0])
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
 * @param renderParams 图谱参数对象，包括 radius节点半径，svgWidth 渲染元素宽度和 svgHeight 渲染元素高度
 */
const renderGraph = (renderSVG, renderParams) => {
    // 图谱参数
    let {radius, svgWidth, svgHeight} = renderParams;
    // 图谱实例对象
    let graphInstance = {};

    d3.json('./dataset/case.json').then(data => {
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
            .force('charge', d3.forceManyBody())
            .force('link', d3.forceLink(graphInstance.edges).id(d => `${d.uuid}`))
            .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
            .on('tick', () => {
                graphInstance.nodesEL
                    .attr('transform', d => `translate(${d.x},${d.y})`);
                graphInstance.edgesEL
                    .selectAll('path')
                    .attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
            })
            .on('end', () => {
                console.log("tickend");
            });

        // 绑定按钮事件
        d3.select('#addNewData')
            .on('click', () => {
                multiLevelDynamicRender(graphInstance)
            });

        /**
         * 绘制连边
         * @param graphInstance 图谱实例对象
         * @param isBaseRender 是否为初始渲染
         */
        function renderEdges(graphInstance, isBaseRender) {
            let containerEl;
            if (isBaseRender) {
                // 当为初始渲染时，添加 linksG 元素
                containerEl = graphInstance.containerEL
                    .append('g')
                    .attr('class', 'linksG');
            } else {
                // 否则直接选择
                containerEl = graphInstance.containerEL
                    .select('g.linksG')
            }

            // 创建子 linkG 元素
            graphInstance.edgesEL = containerEl
                .selectAll('g')
                .data(graphInstance.edges, d => d.uuid)
                .enter()
                .append('g')
                .attr('id', d => `linkG-${d.uuid}`)
                .attr('class', 'linkG');
            const paths = graphInstance.edgesEL
                .append('path')
                .attr('stroke', '#999999')
                .style('stroke-width', 0.75);

            // 淡入
            paths
                .attr('opacity', 0)
                .transition()
                .duration(600)
                .attr('opacity', 1);
        }

        /**
         * 绘制节点
         * @param graphInstance 图谱实例对象
         * @param isBaseRender 是否为初始渲染
         */
        function renderNodes(graphInstance, isBaseRender) {
            let containerEl;
            if (isBaseRender) {
                // 当为初始渲染时，添加 nodesG 元素
                containerEl = graphInstance.containerEL
                    .append('g')
                    .attr('class', 'nodesG');
            } else {
                // 否则直接选择
                containerEl = graphInstance.containerEL
                    .select('g.nodesG')
            }

            // 创建子 nodeG 元素
            graphInstance.nodesEL = containerEl
                .selectAll('g')
                .data(graphInstance.nodes, d => d.uuid)
                .enter()
                .append('g')
                .attr('id', d => `nodeG-${d.uuid}`)
                .attr('class', 'nodeG');
            graphInstance.nodesEL
                .append('circle')
                .attr('stroke', '#ffffff')
                .attr('r', radius)
                .style('fill', '#999999');

            // 淡入
            graphInstance.nodesEL
                .selectAll('circle')
                .attr('opacity', 0)
                .transition()
                .duration(600)
                .attr('opacity', 1);
        }

        /**
         * 随机生成新的点边数据，模拟动态图并渲染
         * @param graphInstance 图谱实例对象
         */
        function multiLevelDynamicRender(graphInstance) {
            // 随机获取一个节点
            let rootNode = graphInstance.nodes[Math.floor((Math.random() * graphInstance.nodes.length))];

            // 获取增量节点数据（随机生成，个数限制在[minNum, maxNum]）
            let minNum = 5, maxNum = 12;
            let nodeNum = Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
            for (let i = 0; i < nodeNum; i++) {
                let nodeItem = {
                    'uuid': generateUUID(),
                    'x': rootNode.x + Math.round((Math.random() - 0.5) * 20),
                    'y': rootNode.y + Math.round((Math.random() - 0.5) * 20)
                };
                let edgeItem = {
                    'uuid': generateUUID(),
                    'source': rootNode['uuid'],
                    'target': nodeItem['uuid']
                };
                graphInstance.nodes.push(nodeItem);
                graphInstance.edges.push(edgeItem);
            }

            // 重新绑定点边数据，并进行绘制
            graphInstance.edgesEL.data(graphInstance.edges, d => d.uuid);
            renderEdges(graphInstance, false);
            graphInstance.nodesEL.data(graphInstance.nodes, d => d.uuid);
            renderNodes(graphInstance, false);

            // 更新点边数据 SVG 元素
            graphInstance.nodesEL = graphInstance.containerEL.select('g.nodesG').selectAll('g.nodeG');
            graphInstance.edgesEL = graphInstance.containerEL.select('g.linksG').selectAll('g.linkG');

            // 重启力模拟器
            graphInstance.simulation.nodes(graphInstance.nodes)
                .force('link', d3.forceLink(graphInstance.edges).id(d => `${d.uuid}`))
                .alpha(0.4).restart();
        }
    });

    /***
     * 生成 UUID
     * @returns {string}
     */
    function generateUUID() {
        let s = [];
        const hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }

};

// 初始化 SVG 画布元素
let renderParams = {
    radius: 3,
    svgWidth: 960,
    svgHeight: 600
};
let renderSVG = initSVGSettings(renderParams);
// 渲染图谱
renderGraph(renderSVG, renderParams);