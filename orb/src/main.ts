export function renderMainPage(): string 
{

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Knowing Orb</title>
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
            <p>Do you wish to ponder the orb?</p>
            <input type="text" id="search" placeholder="Ask your deepest questions" />
            <button id="search-button">Ponder</button>
            <br>
            <br>
            <img src="https://raw.githubusercontent.com/DrMeepso/PonderOrb/refs/heads/main/orb/src/orb.gif">
        </div>
    </div>
    <script>
        document.getElementById('search-button').addEventListener('click', async () => {
            // get the search term
            const searchTerm = document.getElementById('search').value;
            // go to ./searchTerm
            window.location.href = \`/\${searchTerm}\`;
        });
    </script>
    </body>
    </html>`;

    return html;

}

export function renderHeader(): string
{

    const html = `
    <h1>The All Knowing Orb</h1>
    <p>Everything you could ever want to know about anything.</p>
    <hr>
    <br>
    `

    return html;
}