import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';

export type DataTypeArrayElement = {
    title: string;
    value: aasTypes.DataTypeDefXsd;
    text: string;
};

export function getDataTypes(): DataTypeArrayElement[] {
    return [
        { title: 'AnyUri', value: aasTypes.DataTypeDefXsd.AnyUri, text: 'xs:anyURI' },
        { title: 'Base64Binary', value: aasTypes.DataTypeDefXsd.Base64Binary, text: 'xs:base64Binary' },
        { title: 'Boolean', value: aasTypes.DataTypeDefXsd.Boolean, text: 'xs:boolean' },
        { title: 'Byte', value: aasTypes.DataTypeDefXsd.Byte, text: 'xs:byte' },
        { title: 'Date', value: aasTypes.DataTypeDefXsd.Date, text: 'xs:date' },
        { title: 'DateTime', value: aasTypes.DataTypeDefXsd.DateTime, text: 'xs:dateTime' },
        { title: 'Decimal', value: aasTypes.DataTypeDefXsd.Decimal, text: 'xs:decimal' },
        { title: 'Double', value: aasTypes.DataTypeDefXsd.Double, text: 'xs:double' },
        { title: 'Duration', value: aasTypes.DataTypeDefXsd.Duration, text: 'xs:duration' },
        { title: 'Float', value: aasTypes.DataTypeDefXsd.Float, text: 'xs:float' },
        { title: 'GDay', value: aasTypes.DataTypeDefXsd.GDay, text: 'xs:gDay' },
        { title: 'GMonth', value: aasTypes.DataTypeDefXsd.GMonth, text: 'xs:gMonth' },
        { title: 'GMonthDay', value: aasTypes.DataTypeDefXsd.GMonthDay, text: 'xs:gMonthDay' },
        { title: 'GYear', value: aasTypes.DataTypeDefXsd.GYear, text: 'xs:gYear' },
        { title: 'GYearMonth', value: aasTypes.DataTypeDefXsd.GYearMonth, text: 'xs:gYearMonth' },
        { title: 'HexBinary', value: aasTypes.DataTypeDefXsd.HexBinary, text: 'xs:hexBinary' },
        { title: 'Int', value: aasTypes.DataTypeDefXsd.Int, text: 'xs:int' },
        { title: 'Integer', value: aasTypes.DataTypeDefXsd.Integer, text: 'xs:integer' },
        { title: 'Long', value: aasTypes.DataTypeDefXsd.Long, text: 'xs:long' },
        { title: 'NegativeInteger', value: aasTypes.DataTypeDefXsd.NegativeInteger, text: 'xs:negativeInteger' },
        {
            title: 'NonNegativeInteger',
            value: aasTypes.DataTypeDefXsd.NonNegativeInteger,
            text: 'xs:nonNegativeInteger',
        },
        {
            title: 'NonPositiveInteger',
            value: aasTypes.DataTypeDefXsd.NonPositiveInteger,
            text: 'xs:nonPositiveInteger',
        },
        { title: 'PositiveInteger', value: aasTypes.DataTypeDefXsd.PositiveInteger, text: 'xs:positiveInteger' },
        { title: 'Short', value: aasTypes.DataTypeDefXsd.Short, text: 'xs:short' },
        { title: 'String', value: aasTypes.DataTypeDefXsd.String, text: 'xs:string' },
        { title: 'Time', value: aasTypes.DataTypeDefXsd.Time, text: 'xs:time' },
        { title: 'UnsignedByte', value: aasTypes.DataTypeDefXsd.UnsignedByte, text: 'xs:unsignedByte' },
        { title: 'UnsignedInt', value: aasTypes.DataTypeDefXsd.UnsignedInt, text: 'xs:unsignedInt' },
        { title: 'UnsignedLong', value: aasTypes.DataTypeDefXsd.UnsignedLong, text: 'xs:unsignedLong' },
        { title: 'UnsignedShort', value: aasTypes.DataTypeDefXsd.UnsignedShort, text: 'xs:unsignedShort' },
    ];
}
