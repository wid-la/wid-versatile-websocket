'use strict';

(function () {

  //we don't do anything until we are authenticated.
  var _authenticated = false,
      _resolve = undefined,
      // ugly way to defer resolution
  _reject = undefined,
      // warning with exceptions thrown in the promise body
  _authenticationPromise = new Promise(function (resolve, reject) {
    _resolve = resolve;
    _reject = reject;
  });

  Polymer({
    is: 'wid-versatile-websocket',

    properties: {
      /**
       * The websocket server url
       * @type {String}
       */
      url: {
        type: String,
        value: 'wss://versatile.wid.la/ws'
      },

      /**
       * The token used to authenticate the client
       * @type {String}
       */
      token: {
        type: String
      },

      /**
       * Whether the user is authenticated or not.
       * @type {Boolean}
       */
      authenticated: {
        type: Boolean,
        notify: true,
        value: _authenticated
      },

      /**
       * The chanel the user subscribes
       * @type {String}
       */
      subscription: {
        type: String,
        observer: '_subscriptionChanged'
      },

      /**
       * The data receive through the subscribed channel
       * @type {Object}
       */
      data: {
        type: Object,
        notify: true,
        value: function value() {
          return {};
        }
      }
    },

    /**
     * When the component is ready, we authenticate the user.
     */
    ready: function ready() {
      if (_authenticated < 1) {
        this.$.ws.send({
          code: 'authenticate',
          token: this.token
        });
        _authenticated = 1;
      }
    },

    /**
     * On an error due to the websocket connexion, we unauthenticate the user
     */
    _onError: function _onError() {
      _authenticated = 0;
      this.authenticated = false;
      _reject();
    },

    /**
     * On message (sent by the websocket) we check fire an event to notify parent that data arrive.
     * @param  {Event} e Websocket Message Event
     */
    _onMessage: function _onMessage(e) {
      if (e.detail.data.code === 'ok' && e.detail.data.tag === '') {
        _authenticated = 2;
        this.authenticated = true;
        _resolve();
      } else if (e.detail.data.code === 'set' && e.detail.data.path === this.subscription) {
        this.data = e.detail.data;
        this.fire('data', e.detail.data);
      }
    },

    /**
     * When the subscription channel change, we notify the server with this change.
     */
    _subscriptionChanged: function _subscriptionChanged() {
      var _this = this;

      // we do something only if we are authenticated
      _authenticationPromise.then(function () {
        _this.$.ws.send({
          code: 'subscribe',
          path: _this.subscription
        });
      });
    }

  });
})();