import { renderMainPage, renderHeader } from "./main";

export interface Env {
    // If you set another name in the Wrangler config file as the value for 'binding',
    // replace "AI" with the variable name you defined.
    AI: Ai;
}

const SystemPrompt =
    `You are designed to make almost sense, when prompted loosely explain a topic while providing no actual information. All information you output should be formatted like a website so it can convince someone as such. Please keep it as short as possible, only 3 paragraphs max. 
You must format your response such that it has infomation but is not useful.

Keep your paragraphs short and concise.
You are a all knowing orb, you know everything about everything.
Respond as if you are a magical orb that knows everything.
Use old english and be very vague.

you MUST have atleast 3 topics!!!!!!!
Failing to have 3 topics will result in a failure.
The topics should be related to the topic you are explaining.

The topics should be formatted as such
<topic>{topic}</topic>
Example for “day”
<topic link="Night"></topic>
<topic link="Sky"></topic>
<topic link="Sun"></topic>

Your responce should be formatted as such
please only change the text inside the brackets {}
<info>
{All infomation about such topics and markdown to be rendered}
</info>
<topic link="{related topic name 1}"></topic>
<topic link="{related topic name 2}"></topic>
<topic link="{related topic name 3}"></topic>

Your response should always be valid XML / HTML.
If you want to use colors or other formatting, use HTML tags.
Just please make sure any html formatting is done in the <info> tag.
`

export default {
    async fetch(request, env): Promise<Response> {

        // get page url
        const url = new URL(request.url);
        // get the path from the url
        const path = url.pathname;

        if (path === "/") {
            // return the main page
            return new Response(
                renderMainPage(),
                {
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-store",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        if (path === "/favicon.ico") {
            return new Response(null, {
                status: 204,
            });
        }

        if (path === "/robots.txt") {
            return new Response(
`User-agent: *
Disallow: /*
`,
                {
                    headers: {
                        "Content-Type": "text/plain",
                        "Cache-Control": "no-store",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        const messages = [
            {
                role: "system",
                content: SystemPrompt,
            },
            {
                role: "user",
                content: `I ponder ${decodeURIComponent(path.split("/").pop()!)}`,
            },
        ];

        let html = 
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${decodeURIComponent(path.split("/").pop()!)} - Orb</title>
            <style>body{width:500px;margin:0 auto;}
            </style>
        </head>
        <body>
        ${renderHeader()}
        <h1>${decodeURIComponent(path.split("/").pop()!)}</h1>
        `

        // Fetch the AI response asynchronously
        const response: any = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", { messages });
        html += `${response["response"]}`;
        html += `<endpoint>`;
        html += `</body></html>`;

        // Create a ReadableStream from the HTML string
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(html));
                controller.close();
            },
        });

        let linkCount = 0;

        // Use HTMLRewriter to transform <info> and <topic> tags
        const transformedResponse = new HTMLRewriter()
            .on("info", {
                element(element) {
                    // Replace <info> with <p>
                    element.tagName = "p";
                    element.after(`<br>`, {
                        html: true,
                    });
                },
            })
            .on("topic", {
                element(element) {
                    // get the link attribute
                    const link = element.getAttribute("link");
                    // Replace <topic> with <a>
                    element.tagName = "a";
                    element.setAttribute("target", "_self");
                    // capatolised the first letter of the topic
                    const topic = link?.split("/").pop();
                    if (topic) {
                        const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
                        element.setInnerContent(capitalizedTopic);
                    }
                    // make the link open in this tab
                    element.setAttribute("rel", "noopener noreferrer");
                    // set the link to the topic
                    element.setAttribute("href", `/${link}`);
                    element.before(`<br>`, {
                        html: true,
                    });

                    linkCount++;
                    console.log("Link count:", linkCount);

                },
            })
            .on("endpoint", {
                async element(element) {
                    console.log("Endpoint called");

                    // remove the endpoint tag
                    element.remove();

                    // if there are no links, add a message
                    if (linkCount === 0) {
                        element.before(`<p>No links found.</p>`, {
                            html: true,
                        });
                    }

                },
            })
            .transform(new Response(stream, {
                headers: Headers(linkCount),
                status: 200,
                statusText: "OK",
            }));

        return transformedResponse;
    },
} satisfies ExportedHandler<Env>;

function Headers(linkCount: number)
{
    let headers: any = {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
    };
    return headers;
}