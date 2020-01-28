import React, { Component } from 'react';
import PropTypes from 'prop-types';
// Imported order files
import OrderDetails from './Details';
import Msg from '../Messages';
// Polyfills
import 'intersection-observer';
// import 'element-closest';

export default class Single extends Component {
    componentDidMount() {
        const orderHistory = document.getElementById('js-orderhistory');
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
        orderHistory.querySelectorAll('.orderhistory-status').forEach(status => {
            // Animated in view of statusbar
            observer.observe(status);
        });
    }

    render() {
        let currStatus;
        this.msg = new Msg();
        const {
            order,
            popItems,
            index,
            orderitem,
            toggleClickHandler,
            queryParam,
            results,
            fetchOrderDetails,
            orderDetailsHandler
        } = this.props;
        const {
            code, status, guid, orderDetails, fromTnT, statusBar
        } = order;
        const mq = window.matchMedia('(min-width: 1024px)');
        const statusDisplay = order.statusDisplay ? order.statusDisplay : this.msg.unknown;
        const showOrderDetails = index < 2 && mq.matches;
        const url = !showOrderDetails ? `/my-account/order/details?code=${code}&guid=${guid}` : '';
        const hasCancelled = orderDetails ? orderDetails.hasCancelled : order.hasCancelled;
        const lastStatus = statusBar.reduce((hasArr, arr) => arr.isCurrent, false);
        const dateStatus = order.isDeliveryDateInFuture ? this.msg.futureMsg : order.estimatedCompletionDate;
        const DateStatusComp = (props) => {
            return <div className="orderhistory-date-status">
                {lastStatus
                    ? props.shipped : status.code === 'CANCELLED'
                    ? this.msg.cancel : props.standard} {status.code === 'CANCELLED' ? '' : dateStatus}
            </div>;
        };

        // Fetch order details is not already available
        code === queryParam.orderitem && !orderDetails
        && fetchOrderDetails(orderDetails, index, url, results);

        return <div className={`orderhistory-list orderhistory-list--${lastStatus ? 'shipped' : status.code.toLowerCase().replace(/\s/g, '')} ${orderitem && order.code !== queryParam.orderitem ? 'hide' : ''}`}>
            {
                hasCancelled && <div className="orderhistory-results-cancelled">
                    <i className="cc-icon-fielderror" /><strong>{this.msg.note}</strong> - {this.msg.cancelled_info}
                </div>
            }
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
                    <div className="orderhistory-info">{dateStatus ? this.msg.est : this.msg.awaitingDate} {order.estimatedCompletionDate}</div>
                </div>
                <div className="col-xs-12 col-md-2"><span className="hidden-md hidden-lg">{this.msg.orderTotal}</span> <span className="hidden-xs hidden-sm">{this.msg.total}</span>
                    <div className="orderhistory-info">{order.total ? order.total.formattedValue : ''}</div>
                </div>
                <div className="col-xs-12 col-md-3 pull-right">
                    <button
                      type="button"
                      className="btn btn-default btn--lg btn-block-xs hidden-xs hidden-sm"
                      href={`/my-account/order/${code}?guid=${guid}`}
                      onClick={orderDetailsHandler}
                    >{this.msg.orderDetails}</button>
                </div>
            </div>
            <ol className="orderhistory-status">
                {statusBar.map((stat, statIndex) => {
                    const { displayStatus, isCurrent } = stat;
                    return <li
                      key={statIndex}
                      className={`orderhistory-status-step
                        ${(() => {
                            if (isCurrent) {
                                currStatus = true;
                                return 'is-current';
                            }
                        })()} ${!currStatus && !isCurrent ? 'is-done' : ''}`}
                    >
                        <div className="orderhistory-status-label"><span>{displayStatus}</span></div>
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
                            {
                                status.code !== 'CANCELLED'
                                && <DateStatusComp standard={dateStatus ? this.msg.estDelDate : this.msg.awaitingDate} shipped={this.msg.shippedOn} />
                            }
                        </div>
                        <button
                          className={`orderhistory-toggle js-orderhistory-toggle pull-right ${orderitem ? 'hide' : ''}`}
                          type="button"
                          data-order-code={code}
                          data-url={url}
                          data-more-less={showOrderDetails ? this.msg.moreMsg : this.msg.lessMsg}
                          data-index={index}
                          onClick={toggleClickHandler}
                        >
                            {showOrderDetails ? this.msg.lessMsg : this.msg.moreMsg}
                            <i className={`cc-icon cc-icon-${showOrderDetails ? 'close' : 'open'}_m`} />
                        </button>
                    </div>
                </div>
            </div>
            <div className={`product-table ${!showOrderDetails ? 'hide' : ''}`}>
                {
                    (popItems === index || orderDetails)
                    && <OrderDetails data={orderDetails} tnt={fromTnT || false} />
                }
            </div>
        </div>;
    }
}

Single.propTypes = {
    order: PropTypes.shape().isRequired,
    orderitem: PropTypes.string,
    toggleClickHandler: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    popItems: PropTypes.number.isRequired,
    queryParam: PropTypes.shape().isRequired,
    orderDetailsHandler: PropTypes.func.isRequired,
    fetchOrderDetails: PropTypes.func.isRequired,
    results: PropTypes.arrayOf(
        PropTypes.shape().isRequired
    ).isRequired
};

Single.defaultProps = {
    orderitem: null
};