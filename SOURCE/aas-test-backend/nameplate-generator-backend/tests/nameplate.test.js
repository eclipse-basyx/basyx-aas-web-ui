const request = require("supertest");
const { createServer } = require("../src/API/api");

jest.mock("../src/NameplateGeneration/NameplateGenerator", () => ({
    nameplateBootstrap: jest.fn(() => ({
        outerHTML: "<div>Nameplate</div>"
    }))
}));

describe("Backend Communication for Nameplate Generator", () => {

    let server;
    
    beforeEach(() => {
        server = createServer();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Valid request returns HTML response", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                id: "123",
                idShort: "Test",
                submodelElements: []
            })
        });

        const res = await request(server)
            .get("/NameplateGenerateByReference?http://mock.api?123");

        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toContain("text/html");
        expect(res.text).toContain("Nameplate");
    });

    test("Returns 500 when external API fails", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500
        });

        const res = await request(server)
            .get("/NameplateGenerateByReference?http://mock.api?123");

        expect(res.statusCode).toBe(500);
        expect(res.text).toContain("Fehler");
    });

    test("Returns 500 on fetch exception", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        const res = await request(server)
            .get("/NameplateGenerateByReference?http://mock.api?123");

        expect(res.statusCode).toBe(500);
    });

    test("Handles OPTIONS request", async () => {
        const res = await request(server)
            .options("/NameplateGenerateByReference");

        expect(res.statusCode).toBe(204);
    });

    test("Handles malformed URL", async () => {
        const res = await request(server)
            .get("/NameplateGenerateByReference");

        expect(res.statusCode).toBe(500);
    });
});