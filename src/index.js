import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import './scss/index.scss';
// intersection-observerimport App from './App';
import * as serviceWorker from './serviceWorker';
// Imported order files
import OrderList from './order/List';
// Polyfills
import 'whatwg-fetch';
import 'promise-polyfill/src/polyfill';

class Order extends Component {
    constructor(props) {
        super(props);
        this.d = document;
        this.b = this.d.body;
        this.orderHistory = this.d.getElementById('js-orderhistory');
        this.msg = this.orderHistory && this.orderHistory.msg;
        this.orderResults = this.b.querySelector('.orderhistory-results');
        this.switchLayout = this.b.querySelectorAll('.js-orderhistory-view button');
        this.back = this.b.querySelector('.js-orderhistory-back');
        // State initialise
        this.state = {
            isLoading: false,
            displayMode: 'tile',
            currentPage: 0,
            sortValue: '',
            ignorePageNumber: true
        };
    }

    listFunc = () => {
        //  Render Results
        ReactDOM.render(
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" render={props => <OrderList {...props} {...this.state} />} />
                </Switch>
            </BrowserRouter>,
            this.orderHistory
        );
    }

    init() {
        this.orderHistory && this.listFunc();
    }
}

const order = new Order();
order.init();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        let el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}