import React, { Component } from 'react';
import PropTypes from 'prop-types';
// Imported order files
import OrderDetails from './Details';
import Msg from '../Messages';
// Polyfills
import 'intersection-observer';
// import 'element-closest';

export default class Single extends Component {
    constructor(props) {
        super(props);
        this.mq = window.matchMedia('(min-width: 1024px)');
        this.msg = new Msg();
        // Varibles
        this.d = document;
        this.b = this.d.body;
        this.orderHistory = this.d.getElementById('js-orderhistory');
    }

    componentDidMount() {
        // Animated in view of statusbar
        const config = {
            root: null,
            threshold: 0.9
        };
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const tar = entry.target;
                const isCurr = tar.querySelector('.is-current');
                if (entry.isIntersecting && isCurr) {
                    isCurr.classList.add('is-animated');
                    observer.unobserve(tar);
                }
            });
        }, config);
        this.orderHistory.querySelectorAll('.orderhistory-status').forEach(status => {
            observer.observe(status);
        });
    }

    render() {
        let currStatus;
        const {
            displayMode, order, popItems, index, orderItem, toggleClickHandler, productData
        } = this.props;
        const {
            code, guid, statusDisplay, orderDetails, fromTnT
        } = order;
        const showTwoOrderDetails = order.orderDetails && this.mq.matches;
        const url = !showTwoOrderDetails ? `/my-account/order/details?code=${code}&guid=${guid}` : '';
        // statusDisplay = 'Cancelled';

        return <div className={`orderhistory-list orderhistory-list--${statusDisplay.toLowerCase().replace(/\s/g, '')}`} data-display-mode={displayMode}>
            <div className="col-xs-12 col-md-2 hidden-md hidden-lg orderhistory-progress">
                <a href={`/my-account/order/${code}?guid=${guid}`}>{code}</a>
            </div>
            <div className="orderhistory-row orderhistory-header clearfix">
                <div className="col-xs-12 col-md-2 hidden-md hidden-lg">
                    <span className="orderhistory--list--hide">{this.msg.orderStatus}</span>
                    <div className="orderhistory-info text-blue">
                        <i className="cc-icon pull-left" />
                        <button
                          type="button"
                          className="js-status"
                          data-order-code={code}
                          data-url={url}
                          data-index={index}
                          onClick={toggleClickHandler}
                        >
                        {fromTnT ? statusDisplay : this.msg[statusDisplay]}</button>
                    </div>
                </div>
                <div className="col-xs-12 col-md-2 hidden-xs hidden-sm">
                    <span className="orderhistory--list--hide">{this.msg.orderNo}</span>
                    <div className="orderhistory-info">{code}</div>
                </div>
                <div className="col-xs-12 col-md-2">
                    <span className="orderhistory--list--hide">{this.msg.yourOrderNo}</span>
                    <div className="orderhistory-info">{order.purchaseOrderNumber}</div>
                </div>
                <div className="col-xs-12 col-md-2">
                    <span className="orderhistory--list--hide">{this.msg.datePlaced}</span>
                    <div className="orderhistory-info">{order.datePlaced}</div>
                </div>
                <div className="col-xs-12 col-md-2 hidden-md hidden-lg">
                    <span className="orderhistory--list--hide">{this.msg.delDate}</span>
                    <div className="orderhistory-info">{this.msg.est}: {order.estimatedCompletionDate}</div>
                </div>
                <div className="col-xs-12 col-md-2"><span className="hidden-md hidden-lg">{this.msg.order}</span> <span className="orderhistory--list--hide">{this.msg.total}</span>
                    <div className="orderhistory-info">{order.total ? order.total.formattedValue : ''}</div>
                </div>
                <div className="col-xs-12 col-md-3 pull-right">
                    <a className="btn btn-default btn--lg btn-block-xs hidden-xs hidden-sm" href={`/my-account/order/${code}?guid=${guid}`}>{this.msg.orderDetails}</a>
                </div>
            </div>
            <ol className="orderhistory-status">
                {this.msg.statusBar.map(status => {
                    return <li
                      key={`${code}-${status}`}
                      className={`orderhistory-status-step
                        ${(() => {
                            if (statusDisplay === status && !currStatus) {
                                currStatus = true;
                                return 'is-current';
                            }
                        })()} ${statusDisplay !== status && !currStatus ? 'is-done' : ''}`}
                    >
                        <div className="orderhistory-status-label"><span>{status}</span></div>
                    </li>;
                })}
            </ol>
            <div className="orderhistory-row clearfix">
                <div className="cc-icon pull-left hidden-xs hidden-sm" />
                <div className="orderhistory-progressbar pull-right">
                    <div className="orderhistory-currstatus orderhistory-info col-xs-12 hidden-xs hidden-sm">
                        <div>{fromTnT ? statusDisplay : this.msg[statusDisplay]}</div>
                    </div>
                    <div className="col-xs-12">
                        <div className="orderhistory-date">
                            {(() => {
                                if (statusDisplay === 'Shipped') {
                                    return this.msg.shipped;
                                } else if (statusDisplay === 'Cancelled') {
                                    return this.msg.cancelled;
                                } else {
                                    return this.msg.estDelDate;
                                }
                            })()}: {order.isDeliveryDateInFuture ? this.msg.futureMsg : order.estimatedCompletionDate}
                        </div>
                        <button
                          className={`orderhistory-toggle js-orderhistory-toggle pull-right ${orderItem ? 'hide' : ''}`}
                          type="button"
                          data-order-code={code}
                          data-url={url}
                          data-more-less={showTwoOrderDetails ? this.msg.moreMsg : this.msg.lessMsg}
                          data-index={index}
                          onClick={toggleClickHandler}
                        >
                            {showTwoOrderDetails ? this.msg.lessMsg : this.msg.moreMsg}
                            <i className={`cc-icon cc-icon-${showTwoOrderDetails ? 'close' : 'open'}_m`} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="product-table">
                {(popItems === index || showTwoOrderDetails)
                    && <OrderDetails
                      data={orderDetails !== null ? orderDetails : productData}
                      tnt={fromTnT || false}
                    />}
            </div>
        </div>;
    }
}

Single.propTypes = {
    displayMode: PropTypes.string.isRequired,
    order: PropTypes.shape().isRequired,
    orderItem: PropTypes.bool.isRequired,
    toggleClickHandler: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    popItems: PropTypes.number.isRequired,
    productData: PropTypes.shape().isRequired
};