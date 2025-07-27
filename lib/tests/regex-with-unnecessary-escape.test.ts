import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("regex-with-unnecessary-escape fails", () => {
    expect(
        getZodSchema({schema: {
            type: "object",
            properties: {
                str: { 
                    type: "string",
                    pattern: "^\\/$"
                },
            }
        }})
    ).toMatchInlineSnapshot(
        // This is what it should produce, but to prioritize escaping forward slashes without an unnecessary
        // we leave this is failing for now.
        "z.looseObject({ str: z.string().regex(/^\\\\/$/) }).partial()"
    );
});
