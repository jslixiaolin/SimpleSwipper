/**
 * Swipper.js
 * 实现H5单页面手势滑动切换效果
 * 组件只实现了JS切换的逻辑，需要配合相应的css
 * Created by xiaolinli@Ctrip.com
 */
'use strict';

var clientWidth = document.documentElement.clientWidth,
    halfClientWidth = clientWidth / 2;

/**
 * 构造方法
 * @param {*} options: {
 *      container:  滑动的外层容器的class
 *      view:       每屏的class
 *      curIndex:   初始化选中的tab下标
 *      horizontalCbk:   tab滑动切换后的钩子，会传入当前tab的下标
 * } 
 */
var Swipper = function (options) {
    // 滑动外层容器
    this.container = document.querySelector(options.container || '#viewport');
    // 页面
    this.views = document.querySelectorAll(options.view || 'view');
    this.horizontalCbk = options.horizontalCbk || function () {};
    this.verticalCbk = options.verticalCbk || function () {};
    this.curIndex = options.curIndex || 0;
    // 右边界
    this.rightBoundary = this.views.length - 1;
    // 左边界
    this.leftBoundary = 0;
    this.initEvent();
};

Swipper.prototype.initEvent = function () {
    this.initParams();
    this.addEvents();
    // 移动到初始位置
    this.move(-this.curIndex * clientWidth);
};

/**
 * 初始化参数绑定
 */
Swipper.prototype.initParams = function () {
    var param = {
        maxWidth: -clientWidth * (this.views.length - 1), // 页面滑到最后一页的位置
        currentPosition: 0, // 当前位置
        initialPos: 0, // 手指按下的屏幕位置
        moveLength: 0, // 手指当前滑动的距离
        direction: "left", //滑动的方向
        isMove: false, //是否发生左右滑动
        startT: 0, //记录手指按下去的时间
        isTouchEnd: true //标记当前滑动是否结束(手指已离开屏幕) 
    };
    Object.assign(this, param);
};

/**
 * 处理touchstart事件
 */
Swipper.prototype.handleTouchStart = function (e) {
    // 单手指触摸或者多手指同时触摸，禁止第二个手指延迟操作事件
    if (e.touches.length === 1 || this.isTouchEnd) {
        var touch = e.touches[0];
        this.startX = touch.pageX;
        this.startY = touch.pageY;
        this.initialPos = this.currentPosition;
        // 取消动画效果
        this.container.style.webkitTransition = '';
        this.startT = new Date().getTime();
        this.isMove = false;
        this.isTouchEnd = false;

        this.firstFromX = false;
        this.firstFromY = false;
        this.firstMove = true;
    }
};

/**
 * 处理touchmove
 * 只认准单一方向的滑动：
 * x方向开始的，阻止y方向
 * y方向开始的，阻止x方向
 */
Swipper.prototype.handleTouchMove = function (e) {
    var touch = e.touches[0];
    var deltaX = touch.pageX - this.startX,
        deltaY = touch.pageY - this.startY;
    var touchAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    var direction = Swipper.getDirection(touchAngle);
    // 上下滑
    if (direction < 3) {
        if (this.firstMove) {
            this.firstFromY = true;
        }
        if (this.firstFromY) {
            this.verticalCbk(direction);
        }
        this.firstMove = false;
        return;
    } else {
        // 左右滑
        if (this.firstMove) {
            this.firstFromX = true;
        }
        this.firstMove = false;
        if (!this.firstFromX) {
            return;
        }
    }
    // 如果当前滑动已结束，不管其他手指是否在屏幕上都禁止该事件
    if (this.isTouchEnd) {
        return;
    }
    e.preventDefault();
    this.moveLength = deltaX;
    // 需要移动到的位置
    var translate = this.initialPos + deltaX;
    this.move(translate);
    this.isMove = true;

    this.direction = deltaX > 0 ? 'right' : 'left';
};

/**
 * 处理touchend，确定最终停留的页面
 */
Swipper.prototype.handleTouchEnd = function (e) {
    var self = this;
    var deltaT = new Date().getTime() - this.startT;
    if (this.isMove && !this.isTouchEnd) {
        var oldIndex = this.curIndex;
        // 标记当前完整的滑动事件结束
        this.isTouchEnd = true;
        this.container.style.webkitTransition = '.3s ease -webkit-transform';
        if (deltaT < 300 || Math.abs(this.moveLength) > halfClientWidth) {
            // 滑动时间小于300ms，认为是快速滑动，直接切换屏幕，不管具体滑动了多远
            // 滑动距离大于屏幕的一半视为有效滑动
            if (this.direction === 'left') {
                if (this.curIndex < this.rightBoundary) {
                    this.curIndex++;
                }
            } else {
                if (this.curIndex > 0) {
                    this.curIndex--;
                }
            }
        }
        e.preventDefault();
        if (this.curIndex !== oldIndex) {
            // 下标发生变化
            setTimeout(function () {
                self.horizontalCbk(self.curIndex)
            }, 300);
        }
        this.move(-this.curIndex * clientWidth);
    }
};

Swipper.prototype.move = function (translate) {
    // 对边界上的滑动做放缓处理
    if (translate > 0) {
        // 左边界
        translate = translate * 0.4;
    } else if (translate < this.maxWidth) {
        // 右边界
        translate = this.maxWidth + (translate - this.maxWidth) * 0.4;
    }
    this.container.style.webkitTransform = "translate3d(" + translate + "px,0,0)";
    this.currentPosition = translate;
};

// 切换到指定Tab，由外部调用
Swipper.prototype.toggleTab = function (index) {
    this.curIndex = index;
    this.container.style.webkitTransition = '.3s ease -webkit-transform';
    this.move(-index * clientWidth);
};

// 获取滑动方向  1向上 2向下 3向左 4向右
Swipper.getDirection = function (angle) {
    var result = 1;
    if (angle >= -135 && angle <= -45) {
        result = 1;
    } else if (angle > 45 && angle < 135) {
        result = 2;
    } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        result = 3;
    } else if (angle >= -45 && angle <= 45) {
        result = 4;
    }
    return result;
};

// 添加事件绑定
Swipper.prototype.addEvents = function () {
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
};