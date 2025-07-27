import { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("operationId-starting-with-number", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/operationId-starting-with-number": {
                get: {
                    operationId: "123_example",
                    responses: {
                        "200": {
                            content: { "application/json": { schema: { $ref: "#/components/schemas/Basic" } } },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                Basic: { type: "string" },
            },
        },
    };
    const ctx = getZodClientTemplateContext(openApiDoc);
    expect(ctx.endpoints).toMatchInlineSnapshot('undefined');

    // TODO fix
    const result = await generateZodClientFromOpenAPI({
        disableWriteToFile: true,
        openApiDoc,
        options: { withAlias: true },
    });
    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
