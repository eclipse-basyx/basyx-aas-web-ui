export const INFLUX_HEADER = ',result,table,_start,_stop,_time,_value,_field,_measurement,host,topic'

export const INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE = [
  INFLUX_HEADER,
  ',_result,0,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:53.340582794Z,398.98591876151926,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
  ',_result,0,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:54.345702712Z,264.02277354502803,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
].join('\n')

export const INFLUX_LINKED_AIR_QUALITY_MULTI_TABLE = [
  INFLUX_HEADER,
  ',_result,0,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:53.340582794Z,398.98591876151926,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
  ',_result,0,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:54.345702712Z,264.02277354502803,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
  ',_result,1,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:55.351951587Z,695.6357687379142,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
  ',_result,1,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:56.355408004Z,351.39835184433974,value,float_metric,basyx_host,EnvironmentalSensor/AirQuality',
].join('\n')
