export function renderMainPage(): string 
{

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Knowing Orb</title>
        <style>body{width:500px;margin:0 auto;}
        </style>
    </head>
    <body>
    ${renderHeader()}
    <p>Do you wish to ponder the orb?</p>
    <input type="text" id="search" placeholder="Ask your deepest questions" />
    <button id="search-button">Ponder</button>
    <br>
    <br>
    <img src="https://media1.tenor.com/m/oso2RjfPgKkAAAAd/jeanfaymas-jets.gif">
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