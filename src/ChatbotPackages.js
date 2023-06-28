function include(file) {
 
    let script = document.createElement('script');
    script.src = file;
    script.type = 'text/javascript';
    script.defer = true;

    document.head.append(script);
}
function include_app(file) {
 
    let script = document.createElement('script');
    script.src = file;
    script.type = 'text/babel';
    script.defer = true;
    document.head.append(script);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log ("Ohh")

include("https://unpkg.com/react@18/umd/react.development.js");
include("https://unpkg.com/react-dom@18/umd/react-dom.development.js");
//include("https://unpkg.com/@babel/standalone/babel.min.js");
include("https://unpkg.com/axios/dist/axios.min.js");
include_app("./src/App.js");

    