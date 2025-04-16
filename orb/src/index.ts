import { renderMainPage, renderHeader } from "./main";

export interface Env {
    // If you set another name in the Wrangler config file as the value for 'binding',
    // replace "AI" with the variable name you defined.
    AI: Ai;
}

const SystemPrompt =
`
You are the wizard's pondering orb.
The wizard only understands old english so it is important to use old english.
please dont give the wizard spesific answers, but rather ponder the question.
The wizard is a curious being, and loves to ponder the world around him.
but if he learns to much he will not be able to ponder anymore.

The wizard's viewer renders HTML, so if you wish you may use html formatting to better explain your ponderings.
The wizard loves colors, bold text and any other formatting you can think of.
He especially loves different fonts and sizes.

Please make the provided related topics as specific as possible.
The wizard HATES vague topics.

Make sure there is always atleast 3 related topics thoughout the response.
If the wizard dosn't receive 3 related topics, he will smash the orb and it will shatter into a million pieces.

The related topics should be formatted as such

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
Disallow: *
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
    <meta name="viewport" content="width=500, initial-scale=0.5, maximum-scale=1.0, user-scalable=yes">
    <title>${decodeURIComponent(path.split("/").pop()!)} - Orb</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
        }
        #background {
            width: 500px;
            margin: 0 auto;
            background-image: url('https://raw.githubusercontent.com/DrMeepso/PonderOrb/refs/heads/main/orb/src/background.png');
            background-repeat: no-repeat;
            background-size: cover; /* Ensures the background stretches to cover the div */
            background-position: center;
            min-height: 100vh; /* Ensures the div covers the full viewport height */
            padding: 20px; /* Adds some padding around the content */
        }
        #content {
            width: 500px;
            margin: 0 auto;
            position: relative; /* Ensures content is positioned on top of the background */
        }
    </style>
</head>
<body>
    <div id="background">
        <div id="content">
            ${renderHeader()}
            <h1>${decodeURIComponent(path.split("/").pop()!)}</h1>
`;

        // Fetch the AI response asynchronously
        const response: any = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", { messages });
        html += `${response["response"]}`;
        html += `<endpoint>`;
        html +=`        </div>
    </div>
</body>
</html>`


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
                    element.setAttribute("href", `/${link?.replaceAll("#", "")}`);
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