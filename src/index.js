import * as React from 'react'
import Hammer from 'hammerjs'

function createId() {
    var id = -1;
    return function () {
        id = id + 1;
        return id;
    };
}
var getResizeId = createId();

export const Resize = React.createClass({
    getInitialState() {
        return {
            resizeType: '',
            resizeId: getResizeId(),
            handleWidth: '5px',
            handleColor: '#999',
            onResizeStart:  function () {},
            onResizeStop:  function () {},
            onResizeMove:  function () {},
            onResizeWindow:  function () {},
        };
    },

    updateState(props) {
        const handleWidth    = props.handleWidth? props.handleWidth: this.state.handleWidth;
        const handleColor    = props.handleColor? props.handleColor: this.state.handleColor;
        const onResizeStart  = props.onResizeStart? props.onResizeStart: this.state.onResizeStart;
        const onResizeStop   = props.onResizeStop? props.onResizeStop: this.state.onResizeStop;
        const onResizeMove   = props.onResizeMove? props.onResizeMove: this.state.onResizeMove;
        const onResizeWindow = props.onResizeWindow? props.onResizeWindow: this.state.onResizeWindow;

        let resizeType = this.state.resizeType;
        if (props.children.length > 0) {
            if (props.children[0].type.displayName === 'ResizeHorizon') {
                resizeType = 'horizon';
            }
            else if (props.children[0].type.displayName === 'ResizeVertical') {
                resizeType = 'vertical';
            }
        }

        this.setState({
            resizeType: resizeType,
            handleWidth: handleWidth,
            handleColor: handleColor,
            onResizeStart: onResizeStart,
            onResizeStop: onResizeStop,
            onResizeMove: onResizeMove,
            onResizeWindow: onResizeWindow,
        });
    },

    getResize() {
        const $resize = document.querySelectorAll('.resize');
        const id = this.state.resizeId;
        let index = -1;
        for(var i = 0; i < $resize.length; i++) {
            if (id == $resize[i].getAttribute('data-resize-id')) {
                index = i;
            }
        }
        return $resize[index];
    },

    getResizeElement(className) {
        const $resize = this.getResize();
        if (className === 'resize') {
            return $resize;
        }

        const $child = $resize.childNodes;
        let list = [];
        for (var i = 0; i < $child.length; i++) {
            if ($child[i].classList.contains(className)) {
                list.push($child[i]);
            }
        }
        return list;
    },

    getResizeInf() {
        const type = this.state.resizeType;
        let childs = [];
        if (type === 'vertical') {
            const $vertical = this.getResizeElement('resize-vertical');
            for(var i = 0; i < $vertical.length; i++) {
                childs.push({height: $vertical[i].offsetHeight});
            }
        }
        else if (type === 'horizon') {
            const $horizon = this.getResizeElement('resize-horizon');
            for(var i = 0; i < $horizon.length; i++) {
                childs.push({width: $horizon[i].offsetWidth});
            }
        }

        return {
            type: type,
            resizeId: this.state.resizeId,
            resizeChilds: childs,
        };
    },

    stopUserSelect() {
        document.body.style.userSelect       = 'none';
        document.body.style.WebkitUserSelect = 'none';
        document.body.style.MozUserSelect    = 'none';
        document.body.style.MsUserSelect     = 'none';
    },

    deselect() {
        if (window.getSelection) {
            const selection = window.getSelection();
            selection.collapse(document.body, 0);
        }
    },

    onUserSelect() {
        document.body.style.userSelect       = '';
        document.body.style.WebkitUserSelect = '';
        document.body.style.MozUserSelect    = '';
        document.body.style.MsUserSelect     = '';
    },

    eventHandle() {
        const type = this.state.resizeType;
        let $handle = [];
        if (type === 'vertical') {
            $handle = this.getResizeElement('resize-handle-vertical');
        }
        else if (type === 'horizon') {
            $handle = this.getResizeElement('resize-handle-horizon');
        }

        for(var i = 0; i < $handle.length; i++) {
            const hammertime = new Hammer($handle[i]);
            hammertime.get('pan').set({ threshold: 1 });

            hammertime.on('panstart', (ev) => {
                this.stopUserSelect();
                this.deselect();
                this.state.onResizeStart(this.getResizeInf());
            });
            hammertime.on('panend', (ev) => {
                this.onUserSelect();
                this.deselect();
                this.state.onResizeStop(this.getResizeInf());
            });
            hammertime.on('panmove', (ev) => {
                this.deselect();
                if (type ==='vertical') {
                    this.resizeVertical(ev);
                    this.state.onResizeMove(this.getResizeInf());
                }
                else if (type ==='horizon') {
                    this.resizeHorizon(ev);
                    this.state.onResizeMove(this.getResizeInf());
                }
            });
        }
    },

    initialVertical($resize, $vertical) {
        const handleHeight = parseInt(this.state.handleWidth);
        const handleColor  = this.state.handleColor;
        let sumHeight = 0;

        for(var i = 0; i < $vertical.length; i++) {
            // vertical
            const minHeight = $vertical[i].getAttribute('data-min-height');
            $vertical[i].setAttribute('min-height', minHeight);

            // handle style
            const $handle = document.createElement('div');
            $handle.className             = 'resize-handle-vertical';
            $handle.style.height          = handleHeight + 'px';
            $handle.style.cursor          = 's-resize';
            $handle.style.backgroundColor = handleColor;

            if ($vertical[i+1]) {
                $vertical[i].parentNode.insertBefore($handle, $vertical[i].nextSibling);
                sumHeight += handleHeight;
            }

            if (($vertical.length - 1) != i) {
                sumHeight += $vertical[i].offsetHeight;
            }
        }
        $vertical[$vertical.length - 1].style.height = ($resize.offsetHeight - sumHeight) + 'px';
    },

    resizeVertical(e) {
        if (e.velocityY === 0) return;
        const $resize   = this.getResizeElement('resize');
        const $vertical = this.getResizeElement('resize-vertical');
        const $handle   = this.getResizeElement('resize-handle-vertical');
        if (!$resize || $vertical.length === 0 || $handle.length === 0) return;

        const direction = (e.velocityY > 0)? 'down':'up';
        let $prev = e.target.previousElementSibling;
        let $next = e.target.nextElementSibling;
        let prevMinHeight = parseInt($prev.getAttribute('min-height'));
        let nextMinHeight = parseInt($next.getAttribute('min-height'));

        if (direction === 'up') {
            const indx_prev = $vertical.indexOf($prev);
            for (var i = ($vertical.length-1); 0 <= i; i--) {
                if (indx_prev >= i) {
                    if ($prev.offsetHeight <= prevMinHeight) {
                        $prev = $vertical[i];
                        prevMinHeight = parseInt($prev.getAttribute('min-height'));
                    }
                }
            }
        } else if (direction === 'down') {
            const indx_next = $vertical.indexOf($next);
            for (var i = 0; i < $vertical.length; i++) {
                if (indx_next <= i) {
                    if ($next.offsetHeight <= nextMinHeight) {
                        $next = $vertical[i];
                        nextMinHeight = parseInt($next.getAttribute('min-height'));
                    }
                }
            }
        }

        let prevHeight    = 0;
        let nextHeight    = 0;
        let sumPrevHeight = 0;
        let sumHeight     = 0;
        let flag = true;
        for (var i = 0; i < $vertical.length; i++) {
            if (flag) {
                if ($handle[i] === e.target) {
                    flag = false;
                }
                if ($vertical[i] != $prev) {
                    sumPrevHeight += $vertical[i].offsetHeight;
                    sumPrevHeight += $handle[i].offsetHeight;
                }
            }

            if ($vertical[i] !== $prev && $vertical[i] !== $next) {
                sumHeight += $vertical[i].offsetHeight;
            }

            if ($handle[i]) {
                sumHeight += $handle[i].offsetHeight;
            }
        }
        prevHeight = e.center.y - sumPrevHeight - $resize.getBoundingClientRect().top;
        nextHeight = $resize.offsetHeight - (sumHeight + prevHeight);

        if (prevHeight < prevMinHeight) prevHeight = prevMinHeight;
        if (nextHeight < nextMinHeight) nextHeight = nextMinHeight;

        if (direction === 'down' ) {
            prevHeight = $resize.offsetHeight - sumHeight - nextHeight;
            if (prevHeight < prevMinHeight) prevHeight = prevMinHeight;
        } else if (direction === 'up') {
            nextHeight = $resize.offsetHeight - sumHeight - prevHeight;
            if (nextHeight < nextMinHeight) nextHeight = nextMinHeight;
        }

        if ($resize.offsetHeight === (sumHeight + prevHeight + nextHeight)) {
            $prev.style.height = prevHeight + 'px';
            $next.style.height = nextHeight + 'px';
        }
    },

    windowResizeVertical() {
        const $resize   = this.getResizeElement('resize');
        const $vertical = this.getResizeElement('resize-vertical');
        const $handle   = this.getResizeElement('resize-handle-vertical');
        if (!$resize || $vertical.length === 0 || $handle.length === 0) return;

        let sum    = 0;
        let remain = 0;
        for (var i = 0; i < $vertical.length; i++) {
            sum += $vertical[i].offsetHeight;
        }
        for (var i = 0; i < $handle.length; i++) {
            sum += $handle[i].offsetHeight;
        }
        remain = $resize.offsetHeight - sum;

        if (remain > 0) {
            const last_idx = $vertical.length - 1;
            $vertical[last_idx].style.height = (remain + $vertical[last_idx].offsetHeight) + 'px';
        } else if (remain < 0) {
            for(var i = ($vertical.length-1); 0 <= i; i--) {
                var min_height = parseInt($vertical[i].getAttribute('min-height'));
                remain += $vertical[i].offsetHeight - min_height;

                if (remain >= 0) {
                    $vertical[i].style.height = (remain + min_height) + 'px';
                    break;
                }
                $vertical[i].style.height = min_height + 'px';
            }
        }

        this.state.onResizeWindow(this.getResizeInf());
    },

    initialHorizon($resize, $horizon) {
        const handleWidth = parseInt(this.state.handleWidth);
        const handleColor = this.state.handleColor;
        let sumWidth = 0;

        for(var i = 0; i < $horizon.length; i++) {
            // horizon
            const minWidth = $horizon[i].getAttribute('data-min-width');
            $horizon[i].setAttribute('min-width', minWidth);

            // handle style
            const $handle = document.createElement('div');
            $handle.className             = 'resize-handle-horizon';
            $handle.style.width           = handleWidth + 'px';
            $handle.style.cursor          = 'w-resize';
            $handle.style.backgroundColor = handleColor;
            $handle.style.height          = '100%';
            $handle.style.float           = 'left';

            if ($horizon[i+1]) {
                $horizon[i].parentNode.insertBefore($handle, $horizon[i].nextSibling);
                sumWidth += handleWidth;
            }
            if (($horizon.length - 1) != i) {
                sumWidth += $horizon[i].offsetWidth;
            }
        }
        $horizon[$horizon.length - 1].style.width = ($resize.offsetWidth - sumWidth) + 'px';
    },

    resizeHorizon(e) {
        if (e.velocityX === 0) return;
        const $resize  = this.getResizeElement('resize');
        const $horizon = this.getResizeElement('resize-horizon');
        const $handle  = this.getResizeElement('resize-handle-horizon');
        if (!$resize || $horizon.length === 0 || $handle.length === 0) return;

        const direction = (e.velocityX > 0)? 'right':'left';
        let $prev = e.target.previousElementSibling;
        let $next = e.target.nextElementSibling;
        let prevMinWidth = parseInt($prev.getAttribute('min-width'));
        let nextMinWidth = parseInt($next.getAttribute('min-width'));

        if (direction === 'left') {
            const indx_prev = $horizon.indexOf($prev);
            for (var i = ($horizon.length-1); 0 <= i; i--) {
                if (indx_prev >= i) {
                    if ($prev.offsetWidth <= prevMinWidth) {
                        $prev = $horizon[i];
                        prevMinWidth = parseInt($prev.getAttribute('min-width'));
                    }
                }
            }
        } else if (direction === 'right') {
            const indx_next = $horizon.indexOf($next);
            for (var i = 0; i < $horizon.length; i++) {
                if (indx_next <= i) {
                    if ($next.offsetWidth <= nextMinWidth) {
                        $next = $horizon[i];
                        nextMinWidth = parseInt($next.getAttribute('min-width'));
                    }
                }
            }
        }

        let prevWidth    = 0;
        let nextWidth    = 0;
        let sumPrevWidth = 0;
        let sumWidth     = 0;
        let flag = true;
        for (var i = 0; i < $horizon.length; i++) {
            if (flag) {
                if ($handle[i] === e.target) {
                    flag = false;
                }
                if ($horizon[i] != $prev) {
                    sumPrevWidth += $horizon[i].offsetWidth;
                    sumPrevWidth += $handle[i].offsetWidth;
                }
            }

            if ($horizon[i] !== $prev && $horizon[i] !== $next) {
                sumWidth += $horizon[i].offsetWidth;
            }

            if ($handle[i]) {
                sumWidth += $handle[i].offsetWidth;
            }
        }
        prevWidth = e.center.x - sumPrevWidth - $resize.getBoundingClientRect().left;
        nextWidth = $resize.offsetWidth - (sumWidth + prevWidth);

        if (prevWidth < prevMinWidth) prevWidth = prevMinWidth;
        if (nextWidth < nextMinWidth) nextWidth = nextMinWidth;

        if (direction === 'right') {
            prevWidth = $resize.offsetWidth - sumWidth - nextWidth;
            if (prevWidth < prevMinWidth) prevWidth = prevMinWidth;
        } else if (direction === 'left') {
            nextWidth = $resize.offsetWidth - sumWidth - prevWidth;
            if (nextWidth < nextMinWidth) nextWidth = nextMinWidth;
        }

        if ($resize.offsetWidth === (sumWidth + prevWidth + nextWidth)) {
            $prev.style.width = prevWidth + 'px';
            $next.style.width = nextWidth + 'px';
        }
    },

    windowResizeHorizon(e) {
        const $resize  = this.getResizeElement('resize');
        const $horizon = this.getResizeElement('resize-horizon');
        const $handle  = this.getResizeElement('resize-handle-horizon');
        if (!$resize || $horizon.length === 0 || $handle.length === 0) return;

        let sum    = 0;
        let remain = 0;
        for (var i = 0; i < $horizon.length; i++) {
            sum += $horizon[i].offsetWidth;
        }
        for (var i = 0; i < $handle.length; i++) {
            sum += $handle[i].offsetWidth;
        }
        remain = $resize.offsetWidth - sum;

        if (remain > 0) {
            $horizon[$horizon.length - 1].style.width = (remain + $horizon[$horizon.length - 1].offsetWidth) + 'px';
        } else if (remain < 0) {
            for(var i = ($horizon.length-1); 0 <= i; i--) {
                var min_width = parseInt($horizon[i].getAttribute('min-width'));
                remain += $horizon[i].offsetWidth - min_width -1;0

                if (remain >= 0) {
                    $horizon[i].style.width = (remain + min_width) + 'px';
                    break;
                }
                $horizon[i].style.width = min_width + 'px';
            }
        }

        this.state.onResizeWindow(this.getResizeInf());
    },

    initialResize() {
        const type      = this.state.resizeType;
        const $resize   = this.getResizeElement('resize');
        const $vertical = this.getResizeElement('resize-vertical');
        const $horizon  = this.getResizeElement('resize-horizon');
        if (!$resize || $vertical.length === 0 && $horizon.length === 0) return;

        if (type ==='vertical') {
            this.initialVertical($resize, $vertical);
            this.eventHandle();
        }
        else if (type ==='horizon') {
            this.initialHorizon($resize, $horizon);
            this.eventHandle();
        }
    },

    componentDidMount() {
        this.initialResize();
        const type = this.state.resizeType;
        if (type ==='vertical') {
            window.addEventListener('resize', this.windowResizeVertical);
        }
        else if (type ==='horizon') {
            window.addEventListener('resize', this.windowResizeHorizon);
        }
    },

    componentWillUnmount() {
        const type = this.state.resizeType;
        if (type ==='vertical') {
            window.removeEventListener('resize', this.windowResizeVertical);
        }
        else if (type ==='horizon') {
            window.removeEventListener('resize', this.windowResizeHorizon);
        }
    },

    componentWillMount() {
        this.updateState(this.props);
    },

    componentWillReceiveProps(nextProps) {
        this.updateState(nextProps);
    },

    render() {
        const id   = this.state.resizeId;
        const type = this.state.resizeType;

        // resize style
        let style = {
            position: 'absolute',
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
        };
        if (type ==='horizon') {
            style.overflow = 'hidden';
        }

        return <div className="resize" data-resize-id={id} style={style}>{this.props.children}</div>;
    }
});

export const ResizeVertical = React.createClass({
    render() {
        const id        = (this.props.id)?        this.props.id: '';
        const className = (this.props.className)? this.props.className: '';
        const height    = (this.props.height)?    this.props.height: '0';
        const minHeight = (this.props.minHeight)? this.props.minHeight: '0';
        const overflow  = (this.props.overflow)?  this.props.overflow: 'hidden';

        const style = {
            position: 'relative',
            height: parseInt(height) + 'px',
            overflow: overflow,
        };

        return <div id={id}
                    className={"resize-vertical "+className}
                    data-min-height={parseInt(minHeight)}
                    style={style} >
                    {this.props.children}
                </div>;
    }
});

export const ResizeHorizon = React.createClass({
    render() {
        const id        = (this.props.id)?        this.props.id: '';
        const className = (this.props.className)? this.props.className: '';
        const width     = (this.props.width)?     this.props.width: '0';
        const minWidth  = (this.props.minWidth)?  this.props.minWidth: '0';
        const overflow  = (this.props.overflow)?  this.props.overflow: 'hidden';

        const style = {
            position: 'relative',
            height: '100%',
            width: parseInt(width) + 'px',
            float: 'left',
            overflow: overflow,
        };

        return <div id={id}
                    className={"resize-horizon "+className}
                    data-min-width={parseInt(minWidth)}
                    style={style} >
                    {this.props.children}
                </div>;
    }
});