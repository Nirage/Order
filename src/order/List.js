import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import qs from 'qs';
// Imported order files
import OrderSingle from './Single';
import Msg from '../Messages';
import '../scss/Order.scss';

export default class List extends Component {
    constructor(props) {
        super(props);
        // Varibles
        this.d = document;
        this.b = this.d.body;
        this.orderHistory = this.d.getElementById('js-orderhistory');
        // Media Query
        this.mq = window.matchMedia('(min-width: 1024px)');
        this.msg = new Msg();
        // State
        this.state = {
            results: [],
            popItems: -1,
            productData: {}
        };
    }

    componentDidMount() {
        const {
            displayMode, currentPage, sortValue, ignorePageNumber, location
        } = this.props;
        const { search } = location;
        const queryParam = qs.parse(search, { ignoreQueryPrefix: true });

        const mode = queryParam.displayMode ? queryParam.displayMode : displayMode;
        const page = queryParam.page ? queryParam.page : currentPage;
        const sort = queryParam.sort ? queryParam.sort : sortValue;
        // httprequest
        this.getData(mode, page, sort, ignorePageNumber);
    }

    getData = (modeUpdate, currentPageUpdate, sortUpdate, ignorePageNumber) => {
        const param = {
            displayMode: modeUpdate,
            page: currentPageUpdate,
            sort: sortUpdate,
            ignorePageNumber
        };

        fetch(`./orderData.json?${qs.stringify(param)}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const { results, sorts, pagination } = data;
                const { currentPage, pageSize, totalNumberOfResults } = pagination;
                const checkCancelled = results.filter(order => order.orderDetails).map(order => {
                    const { orderDetails } = order;
                    return orderDetails.hasCancelled;
                });
                this.setState(prevState => ({
                    isLoading: true,
                    disableEvent: false,
                    results: param.ignorePageNumber ? results : prevState.results.concat(results),
                    displayMode: modeUpdate,
                    sorts,
                    sortValue: sortUpdate,
                    currentPage,
                    pageSize,
                    totalNumberOfResults,
                    hasCancelled: checkCancelled.indexOf(true) > -1
                }));
            })
            .catch(error => {
                console.error('Requestfailed', error);
                ReactDOM.render(<p>{this.msg.noOrders}</p>, this.orderHistory);
            });
    }

    switchLayoutHandler = e => {
        e.preventDefault();
        const tar = e.target;
        const { displayMode } = tar.dataset;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = this.updateQueryStringParam(search, 'displayMode', displayMode);
        this.setState({ displayMode });
        history.push({ search: queryParam });
        this.viewSwitch(displayMode);
    }

    sortChangeHandler = e => {
        const sortValue = e.target.value;
        const { displayMode, currentPage } = this.state;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = this.updateQueryStringParam(search, 'sort', sortValue);
        this.setState({ disableEvent: true });
        history.push({ search: queryParam });
        this.getData(displayMode, currentPage, sortValue, true);
    }

    loadmoreHandler = e => {
        e.preventDefault();
        const { displayMode, currentPage, sortValue } = this.state;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = this.updateQueryStringParam(search, 'page', currentPage + 1);
        this.setState({ disableEvent: true });
        history.push({ search: queryParam });
        this.getData(displayMode, currentPage + 1, sortValue, false);
    }

    backToListHandler = () => {
        const list = this.orderHistory.querySelectorAll('.orderhistory-list');
        const { history } = this.props;
        history.goBack();
        list.forEach(ls => {
            ls.classList.remove('hide');
            if (ls.querySelector('.js-orderhistory-toggle').dataset.moreLess === 'Less details') {
                ls.querySelector('.product-table').classList.add('hide');
            }
        });
        this.mq.matches && this.setState({ displayMode: 'list' });
        this.orderHistory.querySelector('.js-orderhistory-toggle.hide').classList.remove('hide');
    }

    toggleClickHandler = e => {
        e.preventDefault();
        const tar = e.target.closest('button');
        const tarList = tar.closest('.orderhistory-list');
        const details = tarList.querySelector('.product-table');
        console.log(tar.dataset.index, tar, this.props);
        if (tar.classList.contains('js-status')) {
            const { history } = this.props;
            const list = this.orderHistory.querySelectorAll('.orderhistory-list');
            history.push({ search: `orderitem=${tar.dataset.orderCode}` });
            list.forEach(ls => { if (ls !== tarList) ls.classList.add('hide'); });
            tarList.querySelector('.js-orderhistory-toggle').classList.add('hide');
            details.classList.remove('hide');
            this.setState({ displayMode: 'tile' });
        } else {
            const currMsg = tar.innerText;
            const icon = tar.querySelector('.cc-icon');
            tar.childNodes[0].nodeValue = tar.dataset.moreLess;
            tar.dataset.moreLess = currMsg;
            icon.classList.toggle('cc-icon-close_m');
            icon.classList.toggle('cc-icon-open_m');
            if (details.childElementCount) details.classList.toggle('hide');
        }

        // If Products exists
        if (!details.childElementCount) {
            // Fetch Order Product(s) Details
            fetch(tar.dataset.url)
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    this.setState({
                        popItems: parseInt(tar.dataset.index),
                        productData: data,
                        hasCancelled: data.hasCancelled
                    });
                })
                .catch(error => {
                    console.error('Requestfailed', error);
                });
        }
    }

    viewSwitch(displayMode) {
        const switchMode = 'orderhistory--list';
        const orderClass = this.orderHistory.classList;
        displayMode === 'list' ? orderClass.add(switchMode) : orderClass.remove(switchMode);
    }

    updateQueryStringParam(uri, key, value) {
        const regex = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
        const separator = uri.indexOf('?') !== -1 ? '&' : '?';
        const updateParam = uri.match(regex)
            ? uri.replace(regex, `$1${key}=${value}$2`)
            : `${uri}${separator}${key}=${value}`;
        return updateParam;
    }

    render() {
        const {
            isLoading, popItems, productData, results, totalNumberOfResults, displayMode, currentPage, pageSize, sorts, sortValue, hasCancelled, disableEvent
        } = this.state;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = qs.parse(search, { ignoreQueryPrefix: true });
        const orderItem = typeof queryParam.orderitem !== 'undefined';
        this.viewSwitch(displayMode);

        if (isLoading) {
            if (results.length) {
                const { fromTnT } = results[0];
                return <div className="row">
                    {
                        !fromTnT && <div className="alert alert-danger alert-dismissable getAccAlert">
                            <div className="alert-danger__message">{this.msg.tntNotOrders}</div>
                        </div>
                    }
                    <h1>Order</h1>
                    <div className={`account-section-top ${orderItem ? 'account-section--hide' : ''}`}>
                        <div className="orderhistory-view clearfix">
                            <div className="h3 pull-left js-orderhistory-showing">Showing orders 1-{results.length} of {totalNumberOfResults}</div>
                            <div className="hidden-xs hidden-sm pull-right">
                                <strong>{this.msg.layout}</strong>
                                <div className="btn-group js-orderhistory-view">
                                    <button
                                      type="button"
                                      onClick={this.switchLayoutHandler}
                                      className={`cc-icon-milestone ${displayMode === 'tile' || !displayMode ? 'orderhistory-view--active' : ''}`}
                                      aria-label="tile"
                                      data-display-mode="tile"
                                    />
                                    <button
                                      type="button"
                                      onClick={this.switchLayoutHandler}
                                      className={`cc-icon-list ${displayMode === 'list' ? 'orderhistory-view--active' : ''}`}
                                      data-display-mode="list"
                                      aria-label="list"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pagination-bar row">
                            <label className="col-xs-12 pagination-label" htmlFor="account-select">
                                <span className="h3">{this.msg.sortby}</span>
                                <select
                                  id="account-select"
                                  className={`pagination-sortby form-control ${disableEvent ? 'disabled' : ''}`}
                                  name="sort"
                                  aria-labelledby="account-select"
                                  sortvalue={sortValue}
                                  disabled={disableEvent}
                                  onChange={this.sortChangeHandler}
                                  defaultValue={sortValue.length ? sortValue : 'customerOrderDate_desc'}
                                >
                                    {sorts.map(ops => {
                                        const { code } = ops;
                                        return <option value={code} key={code}>
                                            {this.msg[code]}
                                        </option>;
                                    })}
                                </select>
                            </label>
                        </div>
                        <button
                          onClick={this.backToListHandler}
                          type="button"
                          className="orderhistory-back js-orderhistory-back"
                        >
                            <i className="cc-icon-caretleft_b" />{this.msg.backToList}
                        </button>
                    </div>
                    <div className="hidden-xs hidden-sm well clearfix orderhistory--list-header">
                        <div className="col-md-2">{this.msg.orderNo}</div>
                        <div className="col-md-2">{this.msg.yourOrderNo}</div>
                        <div className="col-md-2">{this.msg.orderStatus}</div>
                        <div className="col-md-2">{this.msg.datePlaced}</div>
                        <div className="col-md-2">{this.msg.delDate}</div>
                        <div className="col-md-2">{this.msg.orderTotal}</div>
                    </div>
                    <div className="orderhistory-results">
                        {
                            hasCancelled && <div className="orderhistory-results-cancelled">
                                <i className="cc-icon-fielderror" /><strong>{this.msg.note}</strong> - {this.msg.cancelled_info}
                            </div>
                        }
                        {
                            results.map((order, index) => {
                                if (orderItem) {
                                    // console.log(orderItem);
                                    if (order.code === queryParam.orderitem) {
                                        console.log(order.code === queryParam.orderitem);
                                        return <OrderSingle
                                          key={order.code}
                                          history={history}
                                          order={order}
                                          index={index}
                                          displayMode={displayMode}
                                          toggleClickHandler={this.toggleClickHandler}
                                          popItems={popItems}
                                          productData={productData}
                                          orderItem={orderItem}
                                          queryParam={queryParam}
                                        />;
                                    }
                                } else {
                                    return <OrderSingle
                                      key={order.code}
                                      history={history}
                                      order={order}
                                      index={index}
                                      displayMode={displayMode}
                                      toggleClickHandler={this.toggleClickHandler}
                                      popItems={popItems}
                                      productData={productData}
                                      orderItem={false}
                                    />;
                                }
                                return false;
                            })
                        }

                        {
                            totalNumberOfResults > (currentPage + 1) * pageSize && <div className="row js-load-more-section">
                                <button
                                  type="button"
                                  className={`btn contentblock__btn btn--lg btn-block-xs js-load-more ${orderItem ? 'hide' : ''} ${disableEvent ? 'disabled' : ''}`}
                                  disabled={disableEvent}
                                  onClick={this.loadmoreHandler}
                                >
                                    {disableEvent ? <i className="loader" /> : this.msg.loadmore}
                                </button>
                            </div>
                        }
                    </div>
                </div>;
            } else {
                // No orders
                return <p>{this.msg.noOrders}</p>;
            }
        } else {
            // On mount load spinner
            return <div className="orderhistory__loader">
                <div className="spinner">
                    <div className="spinner__circle" />
                    <div className="spinner__circle spinner__inner-circle" />
                </div>
            </div>;
        }
    }
}

List.propTypes = {
    displayMode: PropTypes.string.isRequired,
    currentPage: PropTypes.number.isRequired,
    sortValue: PropTypes.string.isRequired,
    ignorePageNumber: PropTypes.bool.isRequired,
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired
};