const { render, useState, useEffect } = window.MiniReact;

function Count(props) {
    return <div>这是count: {props.count}</div>
}

function App() {
    const [count, setCount] = useState(0);

    function handleClick() {
        setCount(count => count + 1);
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setCount((count)=> count + 1)
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return <div>
        <p>{count}</p>
        <Count count={count}></Count>
        <button onClick={handleClick}>加一</button>
    </div>
}

render(<App/>, document.getElementById('root'));
