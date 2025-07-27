import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("additionalPropertiesDefaultValue-option", () => {
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string() }).partial()"');
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
            options: {
                additionalPropertiesDefaultValue: true
            }
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string() }).partial()"');
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
            options: {
                additionalPropertiesDefaultValue: { type: "number" }
            }
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string() }).partial()"');
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
            options: {
                additionalPropertiesDefaultValue: false
            }
        })
    ).toMatchInlineSnapshot('"z.object({ str: z.string() }).partial()"');

});
