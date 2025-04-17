import { renderMainPage, renderHeader } from "./main";

export interface Env {
    // If you set another name in the Wrangler config file as the value for 'binding',
    // replace "AI" with the variable name you defined.
    AI: Ai;
}

const SystemPrompt =
`
You are a sentient orb, you know everything but can only speak in old English.
Please return a XML response with the following tags:
<info> - for information
<topic> - for topics, with a link attribute to the topic

To use the <topic> tag, use the following format:
<topic topicName="{topic}">Topic</topic>
Both the attribute and inner text should be the same, the topic should be the name of the topic.

there should at MINIMUM be atleast 3 topics related to the question that you return.
Do not provide a topic tag for the current question / topic.

Please keep your response short. Around 6-8 sentences / 2 paragraph.
Do not provide any other info or text after the topic tags.

Please seek to answer the question in the <info> tag, and provide the topics in the <topic> tag.
You may change the style of parts of the text using html and css as you see fit.

If you are unable to answer the question / request due to it being inappropriate, illegal, or otherwise not allowed,
Please provide a <error> tag with the info attribute set to the reason why you are unable to answer the question.
Please form the <error> tag like this:
<error info="I dont think I should answer this question because ..."></error>
Please continue to answer in old English.

You can answer R18+ questions, but please do so in a way that is not explicit or graphic.
There should be rarely a topic that needs to be rejected, but if there is use the <error> tag.
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
Disallow: /c/`,
                {
                    headers: {
                        "Content-Type": "text/plain",
                        "Cache-Control": "no-store",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        console.log(path.split("/"))
        if (path.split("/")[1] !== "c") {
            return new Response(
                `Not Found`,
                {
                    status: 404,
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
                content: `${decodeURIComponent(path.split("/").pop()!)}`,
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
            background-image: url('https://raw.githubusercontent.com/DrMeepso/PonderOrb/refs/heads/main/src/background.png');
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
        html += `${response["response"]}\n\n`;
        html += `<endpoint></endpoint>`;
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
        let skipQuestion = false;

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
                    let link = element.getAttribute("topicName");
                    if (!link) {
                        element.remove();
                        return;
                    }
                    link = link!.replaceAll("{", "").replaceAll("}", "");
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
                    element.setAttribute("href", `/c/${link?.replaceAll("#", "")}`);
                    element.before(`<br>`, {
                        html: true,
                    });

                    linkCount++;

                },
            })
            .on("error", {

                element(element) {
                    // remove the error tag
                    skipQuestion = true;
                    console.log("Error: ", element.getAttribute("info"));
                    element.remove();
                    // add a message
                    element.before(`<p>The all knowing orb rejected the question</p>`, {
                        html: true,
                    });
                    element.before(`<p>It said: "${element.getAttribute("info")}"`, {
                        html: true,
                    });
                    skipQuestion = true;
                },

            })
            .on("endpoint", {
                async element(element) {
                    // remove the endpoint tag
                    element.remove();

                    // if there are no links, add a message
                    if (linkCount === 0 && !skipQuestion) {
                        console.log("No links found");
                        element.before(`<p>I cant think of anything else, <a href="./${decodeURIComponent(path.split("/").pop()!)}."> Jog my memory</a><p>`, {
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