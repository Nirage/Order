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
        this.msg = new Msg();
        // State
        this.state = {
            results: [],
            popItems: -1,
            openDetails: [],
            ignorePageNumber: true
        };
    }

    componentDidMount() {
        this.getData();
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.location) {
            if (nextProps.location.search !== prevState.location.search) return;
        }
        return null;
    }

    componentDidUpdate(prevProps) {
        const { location } = this.props;
        const currPropsParam = qs.parse(location.search, { ignoreQueryPrefix: true });
        const prevPropsParam = qs.parse(prevProps.location.search, { ignoreQueryPrefix: true });
        const scrollY = sessionStorage.getItem('scrollY');
        // Only fetch data if page OR sort values are different
        if (prevPropsParam.page !== currPropsParam.page || prevPropsParam.sort !== currPropsParam.sort) {
            // Param page values can be different in orderitem
            if (currPropsParam.orderitem === prevPropsParam.orderitem) {
                this.getData();
                window.scrollTo(0, 0);
            } else if (scrollY) {
                window.scrollTo(0, scrollY);
            }
        }
    }

    getData = () => {
        const { displayMode, ignorePageNumber } = this.state;
        const { currentPage, sortValue, location } = this.props;
        const { search } = location;
        const queryParam = qs.parse(search, { ignoreQueryPrefix: true });
        const mode = queryParam.displayMode ? queryParam.displayMode : displayMode;
        const page = queryParam.page ? queryParam.page : currentPage;
        const sort = queryParam.sort ? queryParam.sort : sortValue;

        const param = {
            displayMode: mode,
            page,
            sort,
            ignorePageNumber
        };

        fetch(`./orderData.json?${qs.stringify(param)}`)
            .then(response => response.json())
            .then(data => {
                const { results, sorts, pagination } = data;
                const { pageSize, totalNumberOfResults } = pagination;
                this.setState(prevState => ({
                    isLoading: true,
                    disableEvent: false,
                    results: param.ignorePageNumber ? results : prevState.results.concat(results),
                    displayMode: mode,
                    sorts,
                    sortValue: sort,
                    currentPage: pagination.currentPage,
                    pageSize,
                    totalNumberOfResults
                }));
                console.log(this.state);
            })
            .catch(error => {
                console.error('Requestfailed', error);
                const orderHistory = document.getElementById('js-orderhistory');
                ReactDOM.render(<p>{this.msg.noOrders}</p>, orderHistory);
            });
    }

    fetchOrderDetails = (orderDetails, index, url, results) => {
        const updateResults = [...results]; // clone

        !orderDetails && fetch(url)
            .then(response => response.json())
            .then(data => {
                // Inject OrderDetails to targeted Order
                const order = updateResults[parseInt(index)];
                order.orderDetails = data;
                order.hasCancelled = order.orderDetails.hasCancelled;

                this.setState({
                    results: updateResults,
                    popItems: parseInt(index)
                });
                sessionStorage.removeItem('scrollY');
            })
            .catch(error => {
                console.error('Requestfailed', error);
            });
    }

    orderDetailsHandler = e => {
        e.preventDefault();
        sessionStorage.setItem('scrollY', window.pageYOffset);
        window.location.href = e.target.getAttribute('href');
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
        sessionStorage.removeItem('scrollY');
    }

    sortChangeHandler = e => {
        const sortValue = e.target.value;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = this.updateQueryStringParam(search, 'sort', sortValue);
        this.setState({ disableEvent: true, popItems: -1 });
        history.push({ search: queryParam });
        sessionStorage.removeItem('scrollY');
    }

    loadmoreHandler = e => {
        e.preventDefault();
        const { currentPage } = this.state;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = this.updateQueryStringParam(search, 'page', currentPage + 1);
        this.setState({ disableEvent: true, currentPage: currentPage + 1 });
        history.push({ search: queryParam });
        sessionStorage.removeItem('scrollY');
    }

    backToListHandler = () => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const { history } = this.props;
        history.goBack();
        mq.matches && this.setState({ displayMode: 'list' });
        sessionStorage.removeItem('scrollY');
    }

    toggleClickHandler = e => {
        e.preventDefault();
        const tar = e.target.closest('button');
        const { results, currentPage, openDetails } = this.state;
        const { index, orderCode } = tar.dataset;
        const { code, guid, orderDetails } = results[parseInt(index)];
        const url = `/my-account/order/details?code=${code}&guid=${guid}`;
        // Status Button
        if (tar.classList.contains('js-status')) {
            const { history } = this.props;
            const queryParam = {
                orderitem: orderCode,
                page: currentPage
            };
            history.push({ search: qs.stringify(queryParam) });
        } else {
            // More / Less Button
            const currMsg = tar.innerText;
            const icon = tar.querySelector('.cc-icon');
            const tarList = tar.closest('.orderhistory-list');
            const details = tarList.querySelector('.product-table');
            tar.childNodes[0].nodeValue = tar.dataset.moreLess;
            tar.dataset.moreLess = currMsg;
            icon.classList.toggle('cc-icon-close_m');
            icon.classList.toggle('cc-icon-open_m');
            details.classList.toggle('hide');
            this.setState({ openDetails: openDetails.concat(orderCode) });
        }

        this.fetchOrderDetails(orderDetails, index, url, results);
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
            isLoading,
            popItems,
            results,
            openDetails,
            totalNumberOfResults,
            currentPage,
            pageSize,
            sorts,
            sortValue,
            disableEvent
        } = this.state;
        const { history, location } = this.props;
        const { search } = location;
        const queryParam = qs.parse(search, { ignoreQueryPrefix: true });
        const { orderitem } = queryParam;
        const queryDisplayMode = queryParam.displayMode;

        if (isLoading) {
            if (results.length) {
                const { fromTnT } = results[0];
                return <div className={`orderhistory row ${queryDisplayMode === 'list' ? 'orderhistory--list' : ''}`}>
                    {
                        !fromTnT && <div className="alert alert-danger alert-dismissable getAccAlert">
                            <div className="alert-danger__message">{this.msg.tntNotOrders}</div>
                        </div>
                    }
                    <h1>Order</h1>
                    <div className={`account-section-top ${orderitem ? 'account-section--hide' : ''}`}>
                        <div className="orderhistory-view clearfix">
                            <div className="h3 pull-left js-orderhistory-showing">Showing orders 1-{results.length} of {totalNumberOfResults}</div>
                            <div className="hidden-xs hidden-sm pull-right">
                                <strong>{this.msg.layout}</strong>
                                <div className="btn-group js-orderhistory-view">
                                    <button
                                      type="button"
                                      onClick={this.switchLayoutHandler}
                                      className={`cc-icon-milestone ${queryDisplayMode === 'tile' || !queryDisplayMode ? 'orderhistory-view--active' : ''}`}
                                      aria-label="tile"
                                      data-display-mode="tile"
                                      title={this.msg.tileview}
                                    />
                                    <button
                                      type="button"
                                      onClick={this.switchLayoutHandler}
                                      className={`cc-icon-list ${queryDisplayMode === 'list' ? 'orderhistory-view--active' : ''}`}
                                      data-display-mode="list"
                                      aria-label="list"
                                      title={this.msg.listview}
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
                          type="button"
                          onClick={this.backToListHandler}
                          className="cc-icon-list"
                          data-display-mode="list"
                          aria-label="list"
                          title={this.msg.listview}
                        />
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
                            results.map((order, index) => {
                                const props = {
                                    key: order.code,
                                    history,
                                    order,
                                    index,
                                    popItems,
                                    orderitem,
                                    queryParam,
                                    results,
                                    orderDetailsHandler: this.orderDetailsHandler,
                                    openDetails,
                                    toggleClickHandler: this.toggleClickHandler,
                                    fetchOrderDetails: this.fetchOrderDetails
                                };
                                // Check query param otherItem
                                return orderitem
                                    ? order.code === queryParam.orderitem && <OrderSingle {...props} />
                                    : <OrderSingle {...props} />;
                            })
                        }
                        {
                            totalNumberOfResults > (currentPage + 1) * pageSize && <div className="row js-load-more-section">
                                <button
                                  type="button"
                                  className={`btn contentblock__btn btn--lg btn-block-xs js-load-more ${orderitem ? 'hide' : ''} ${disableEvent ? 'disabled' : ''}`}
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