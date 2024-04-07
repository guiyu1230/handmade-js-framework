"use strict";
const { render, useState, useEffect } = window.MiniReact;
function Count(props) {
    return MiniReact.createElement("div", null,
        "\u8FD9\u662Fcount: ",
        props.count);
}
function App() {
    const [count, setCount] = useState(0);
    function handleClick() {
        setCount(count => count + 1);
    }
    useEffect(() => {
        const timer = setInterval(() => {
            setCount((count) => count + 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);
    return MiniReact.createElement("div", null,
        MiniReact.createElement("p", null, count),
        MiniReact.createElement(Count, { count: count }),
        MiniReact.createElement("button", { onClick: handleClick }, "\u52A0\u4E00"));
}
render(MiniReact.createElement(App, null), document.getElementById('root'));
