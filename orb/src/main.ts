export function renderMainPage(): string 
{

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Knowing Orb</title>
        <style>
    html {
        margin: 0;
    }
    body {
        width: 500px;
        margin: 0 auto;
        background-image: url('https://raw.githubusercontent.com/DrMeepso/PonderOrb/refs/heads/main/orb/src/background.png');
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        min-height: 100vh;
    }
        </style>
    </head>
    <body>
    ${renderHeader()}
    <p>Do you wish to ponder the orb?</p>
    <input type="text" id="search" placeholder="Ask your deepest questions" />
    <button id="search-button">Ponder</button>
    <br>
    <br>
    <img src="https://raw.githubusercontent.com/DrMeepso/PonderOrb/refs/heads/main/orb/src/orb.gif">
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