import { describe, expect, it } from 'vitest';
import { uploadHandler } from '@/utils/XmlValidator';


    const Testdatafiles = [
        {
            mimeType: "text/xml",
            title: "kbl_noheader.kbl",
            content: `
                </kbl:KBL_container>
                `,
            result: "XML header is missing."
        },
        {
            mimeType: "text/xml",
            title: "kbl_vec_inside.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                    <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                        <VecVersion>1.1.3</VecVersion>
                        <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                        <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                        <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                        <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                        </kbl:KBL_container>
                    </ns2:VecContent>
                </kbl:KBL_container>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "kbl_normal.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                </kbl:KBL_container>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "kbl_faultykbl.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version_id="2.3 SR-1">	
                </kbl:KBL_container>
                `,
            result: "XML is not well-formed."
        },
        {
            mimeType: "text/xml",
            title: "kbl_faultyxml.kbl",
            content: `
                <?xml encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                </kbl:KBL_container>
                `,
            result: "XML is not well-formed."
        },
        {
            mimeType: "text/xml",
            title: "kbl_nokbl.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                </kbl:KBL_container>
                `,
            result: "XML is not well-formed."
        },
        {
            mimeType: "text/xml",
            title: "kbl_xml.xml",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                </kbl:KBL_container>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "kbl_vec.vec",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <?elena version="2.8.0-b7" system="Windows 10 10.0" compilation_date="11.07.2018" compilation_time="17:12:00"?>
                <?extraction date="18.07.2018" time="13:11:58"?>
                <?pc checksum="695947884"?>
                <?xsd validated="true"?>
                <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                </kbl:KBL_container>
                `,
            result: "KBL_container is not a valid root element for .vec files."
        },
        {
            mimeType: "text/xml",
            title: "vec_normal.vec",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <VecVersion>1.1.3</VecVersion>
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                </ns2:VecContent>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "vec_kbl.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <VecVersion>1.1.3</VecVersion>
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                </ns2:VecContent>
                `,
            result: "VecContent is not a valid root element for .kbl files."
        },
        {
            mimeType: "text/xml",
            title: "vec_endkbl.kbl",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <VecVersion>1.1.3</VecVersion>
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                </kbl:KBL_container>
                `,
            result: "XML is not well-formed."
        },
        {
            mimeType: "text/xml",
            title: "vec_noversion.vec",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                </ns2:VecContent>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "vec_kbl_inside.vec",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <VecVersion>1.1.3</VecVersion>
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                    <kbl:KBL_container xmlns:kbl="http://www.prostep.org/Car_electric_container/KBL2.3/KBLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="KBL_container" version_id="2.3 SR-1">	
                    </kbl:KBL_container>
                </ns2:VecContent>
                `,
            result: ""
        },
        {
            mimeType: "text/xml",
            title: "missing_close.vec",
            content: `
                <?xml version="1.0" encoding="UTF-8"?>
                <ns2:VecContent xmlns:ns2="http://www.prostep.org/ecad-if/2011/vec" id="id_vec_content_1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.prostep.org/ecad-if/2011/vec file:///C:/Users/kyriazis/Projektdokumente/VDA%20Standards/VEC/Schema/VEC1.1.3_final/vec_1.1.3.xsd">
                    <VecVersion>1.1.3</VecVersion>
                    <GeneratingSystemName>VOBES NG</GeneratingSystemName>
                    <DateOfCreation>2018-07-20T09:38:39.228+02:00</DateOfCreation>
                    <GeneratingSystemVersion>1.1.43</GeneratingSystemVersion>
                    <Description>
                </ns2:VecContent>
                `,
            result: "XML is not well-formed."
        }
    ]

describe("XMLValidator.ts; Tests for 'uploadHandler()'", () => { 
    Testdatafiles.forEach(({ mimeType, title, content, result }) => {
    it(`should process file "${title}" correctly`, async () => {
      // create File from string
      const file = new File([content.trimStart()], title, { type: mimeType });
    
      const output = await uploadHandler(file);

      expect(output).toBe(result);
    });
  });
});
