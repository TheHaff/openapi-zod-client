import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("withImplicitRequired-option", () => {
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                    nested: {
                        additionalProperties: { type: "number" },
                    },
                },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string(), nested: z.record(z.number()) }).partial()"');
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                    nested: {
                        additionalProperties: { type: "number" },
                    },
                },
            },
            options: {
                withImplicitRequiredProps: true,
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string(), nested: z.record(z.number()) })"');
});
