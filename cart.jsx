// simulate getting products from DataBase
const products = [
  { name: "Apples_:", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges:", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans__:", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage:", country: "USA", cost: 1, instock: 8 },
];

//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URL");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

//=========Product List=============
const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
    Input,
  } = ReactBootstrap;

  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);
  // Fetch Data

  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.find((item) => item.name === name);
    if (item.instock === 0) return;
    setCart((prev) => [...prev, item]);
    setItems((prev) =>
      prev.map((item) => {
        if (item.name === name) {
          return { ...item, instock: item.instock - 1 };
        } else {
          return item;
        }
      })
    );
  };

  const photos = (index) => `https://picsum.photos/id/${index + 1049}/200/200`;

  let list = items.map((item, index) => {
    let cleanedName = item.name.replace(/[_:]+/g, "");

    return (
      <li key={index}>
        <Image src={photos(index)} width={70} roundedCircle></Image>
        <Button variant="primary" size="large">
          {cleanedName}: ${item.cost} - In Stock: {item.instock}
        </Button>
        <input name={item.name} type="submit" onClick={addToCart}></input>
      </li>
    );
  });

  //=========Cart List=============

  let cartList = cart.reduce((acc, item) => {
    let cleanedName = item.name.replace(/[_:]+/g, "");

    // if the item is already in the accumulator, increment the count
    if (acc[cleanedName]) {
      acc[cleanedName].count++;
    } else {
      // else add the item to the accumulator
      acc[cleanedName] = { ...item, count: 1 };
    }

    return acc;
  }, {});

  cartList = Object.entries(cartList).map((entry, index) => {
    const [name, item] = entry;

    const deleteItem = () => {
      const index = cart.findIndex((cartItem) => cartItem.name.replace(/[_:]+/g, '') === name);
      if (index !== -1) {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
        const newItems = items.map((item) => {
          if (item.name.replace(/[_:]+/g, '') === name) item.instock++;
          return item;
        });
        setItems(newItems);
      }
    };
    
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {name}: {item.count} item(s)
          </Accordion.Toggle>
          <Button onClick={deleteItem} variant="danger">Remove</Button>
        </Card.Header>
        <Accordion.Collapse eventKey={1 + index}>
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let cartItems = cart.reduce((acc, item) => {
      let cleanedName = item.name.replace(/[_:]+/g, "");

      if (acc[cleanedName]) {
        acc[cleanedName].count++;
        acc[cleanedName].totalCost += item.cost;
      } else {
        acc[cleanedName] = {
          ...item,
          count: 1,
          totalCost: item.cost,
        };
      }

      return acc;
    }, {});

  //=========Checkout List=============

    let total = checkOut();

    let final = Object.entries(cartItems).map((entry, index) => {
      const [name, item] = entry;
      return (
        <div key={index} index={index}>
          {name} total: $ {item.totalCost}
        </div>
      );
    });

    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };


  //=========Restock Function=============

  const restockProducts = async (url) => {
    await doFetch(url);
    if (data && data.data.length > 0) {
      let newItems = data.data.map((item) => {
        let { name, country, cost, instock } = item.attributes;
        return { name, country, cost, instock };
      });
      setItems([...items, ...newItems]);
    }
  };
  
//=========Render App=============

  return (
    <Container>
    <Row>
      <Col>
        <h1>Product List</h1>
        <ul style={{ listStyleType: "none" }}>{list}</ul>
      </Col>
      <Col>
        <h1>Cart Contents</h1>
        <Accordion>{cartList}</Accordion>
      </Col>
      <Col>
        <h1>CheckOut </h1>
        <Button onClick={checkOut}>CheckOut</Button>
        <div>Total: $ {finalList().total}</div>
        {finalList().final}
      </Col>
    </Row>
    <Row>
      <form
        onSubmit={(event) => {
          event.preventDefault();  // prevent the form from causing a page refresh
          restockProducts(`http://localhost:1337/${query}`);
          console.log(`Restock called on ${query}`);
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">ReStock Products</button>
      </form>
    </Row>
    </Container>
  );
};

// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));
