export const AAS_INTERFACES: string[] = [
  'AAS-REGISTRY-3.0',
  'AAS-DISCOVERY-3.0',
  'AAS-REPOSITORY-3.0',
  'SUBMODEL-REGISTRY-3.0',
  'SUBMODEL-REPOSITORY-3.0',
  'AASX-FILE-3.0',
] as const

export const PROTOCOLS = [
  'HTTP', 'HTTPS', 'FTP', 'FTPS', 'SFTP',
  'MQTT', 'MQTTS', 'AMQP', 'AMQPS', 'OPC-UA', 'TCP',
] as const
