import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject } from "openapi3-ts";
import { Options, resolveConfig } from "prettier";
import { getZodClientTemplateContext } from "../src/template-context";
import { getHandlebars } from "../src/getHandlebars";
import { maybePretty } from "../src/maybePretty";

import fg from "fast-glob";

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

let prettierConfig: Options | null;
const pkgRoot = process.cwd();

beforeAll(async () => {
    prettierConfig = await resolveConfig(path.resolve(pkgRoot, "../"));
});

describe("samples-generator", async () => {
    const samplesPath = path.resolve(pkgRoot, "../", "./samples/v3\\.*/**/*.yaml");
    const list = fg.sync([samplesPath]);

    const template = getHandlebars().compile(readFileSync("./src/templates/default.hbs", "utf8"));
    const resultByFile = {} as Record<string, string>;

    for (const docPath of list) {
        test(docPath, async () => {
            const openApiDoc = (await SwaggerParser.parse(docPath)) as OpenAPIObject;
            const data = getZodClientTemplateContext(openApiDoc);

            const output = template({ ...data, options: { ...data.options, apiClientName: "api" } });
            const prettyOutput = maybePretty(output, prettierConfig);
            const fileName = docPath.replace("yaml", "");

            // means the .ts file is valid
            expect(prettyOutput).not.toBe(output);
            resultByFile[fileName] = prettyOutput;
        });
    }

    test("results by file", () => {
        expect(
            Object.fromEntries(Object.entries(resultByFile).map(([key, value]) => [key.split("samples/").at(1), value]))
        ).toMatchInlineSnapshot(`
          {
              "v3.0/api-with-examples.": "import { z } from "zod";
          ",
              "v3.0/callback-example.": "import { z } from "zod";
          ",
              "v3.0/link-example.": "import { z } from "zod";
          ",
              "v3.0/petstore-expanded.": "import { z } from "zod";
          ",
              "v3.0/petstore.": "import { z } from "zod";
          ",
              "v3.0/uspto.": "import { z } from "zod";
          ",
              "v3.1/non-oauth-scopes.": "import { z } from "zod";
          ",
              "v3.1/webhook-example.": "import { z } from "zod";
          ",
          }
        `);
    });
});
