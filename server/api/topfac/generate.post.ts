export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { convertedText } = body

    if (!convertedText) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少转换后的文本'
      })
    }

    // 解析转换后的文本
    const topology = parseTopologyText(convertedText)
    
    // 生成DrawIO XML
    const drawioXml = generateDrawIOXML(topology)

    return {
      success: true,
      topology,
      drawioXml
    }

  } catch (error: any) {
    console.error('拓扑生成错误:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '拓扑生成服务异常'
    })
  }
})

// 解析拓扑文本
function parseTopologyText(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  
  const topology = {
    environments: 0,
    datacenters: 0,
    areas: 0,
    devices: 0,
    environment: '',
    datacenter: '',
    area: '',
    deviceList: [] as Array<{name: string, type: string}>,
    connections: [] as Array<{from: string, to: string}>
  }

  let currentSection = ''
  
  for (const line of lines) {
    if (line.startsWith('环境:')) {
      topology.environment = line.replace('环境:', '').trim()
      topology.environments = 1
    } else if (line.startsWith('数据中心:')) {
      topology.datacenter = line.replace('数据中心:', '').trim()
      topology.datacenters = 1
    } else if (line.startsWith('网络区域:')) {
      topology.area = line.replace('网络区域:', '').trim()
      topology.areas = 1
    } else if (line === '设备:') {
      currentSection = 'devices'
    } else if (line === '连接:') {
      currentSection = 'connections'
    } else if (line.startsWith('- ') && currentSection === 'devices') {
      const deviceMatch = line.match(/- (.+?) \(类型: (.+?)\)/)
      if (deviceMatch) {
        topology.deviceList.push({
          name: deviceMatch[1].trim(),
          type: deviceMatch[2].trim()
        })
        topology.devices++
      }
    } else if (line.startsWith('- ') && currentSection === 'connections') {
      const connectionMatch = line.match(/- (.+?) <-> (.+?)$/)
      if (connectionMatch) {
        topology.connections.push({
          from: connectionMatch[1].trim(),
          to: connectionMatch[2].trim()
        })
      }
    }
  }

  return topology
}

// 生成DrawIO XML
function generateDrawIOXML(topology: any): string {
  const devices = topology.deviceList
  const connections = topology.connections
  
  // 设备图标映射
  const deviceIcons = {
    '路由器': 'router',
    '交换机': 'switch',
    '服务器': 'server',
    '防火墙': 'firewall',
    '负载均衡器': 'loadbalancer'
  }

  // 计算设备位置
  const positions = calculateDevicePositions(devices.length)
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="NSSA-Tools" version="1.0">
  <diagram name="网络拓扑" id="topology">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
`

  // 添加设备
  devices.forEach((device: any, index: number) => {
    const pos = positions[index]
    const icon = deviceIcons[device.type as keyof typeof deviceIcons] || 'device'
    
    xml += `        <mxCell id="device_${index}" value="${device.name}" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn3.iconfinder.com/data/icons/network-and-communications-6/130/${icon}-512.png" vertex="1" parent="1">
          <mxGeometry x="${pos.x}" y="${pos.y}" width="60" height="60" as="geometry" />
        </mxCell>
`
  })

  // 添加连接
  connections.forEach((connection: any, index: number) => {
    const fromIndex = devices.findIndex((d: any) => d.name === connection.from)
    const toIndex = devices.findIndex((d: any) => d.name === connection.to)
    
    if (fromIndex !== -1 && toIndex !== -1) {
      xml += `        <mxCell id="connection_${index}" value="" style="endArrow=none;html=1;rounded=0;" edge="1" parent="1" source="device_${fromIndex}" target="device_${toIndex}">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="390" y="340" as="sourcePoint" />
            <mxPoint x="440" y="290" as="targetPoint" />
          </mxGeometry>
        </mxCell>
`
    }
  })

  xml += `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`

  return xml
}

// 计算设备位置
function calculateDevicePositions(deviceCount: number) {
  const positions = []
  const centerX = 400
  const centerY = 300
  const radius = Math.max(100, deviceCount * 20)
  
  for (let i = 0; i < deviceCount; i++) {
    const angle = (2 * Math.PI * i) / deviceCount
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    positions.push({ x: Math.round(x), y: Math.round(y) })
  }
  
  return positions
}
