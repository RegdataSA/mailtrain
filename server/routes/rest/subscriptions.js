'use strict';

const passport = require('../../lib/passport');
const subscriptions = require('../../models/subscriptions');
const {SubscriptionSource} = require('../../../shared/lists');
const {engineProvider, Criteria} = require('../../lib/engine');

const router = require('../../lib/router-async').create();
const {castToInteger} = require('../../lib/helpers');


router.postAsync('/subscriptions-table/:listId/:segmentId?', passport.loggedIn, async (req, res) => {
    const resSubscribers = await subscriptions.listDTAjax(
        req.context,
        castToInteger(req.params.listId),
        req.params.segmentId ? castToInteger(req.params.segmentId) : null,
        req.body
    );

    const decryptedSubscribersData = await Promise.all(
        resSubscribers.data.map(async subscriber => {
            const subscriberObject = subscriptions.subscriberColumnsToObject(subscriber);
            const decryptedSubscriber = await engineProvider.decryptInstance(subscriberObject, Criteria.SUBSCRIBER);
            return subscriptions.subscriberObjectToColumns(decryptedSubscriber);
        })
    );

    return res.json({...resSubscribers, data: decryptedSubscribersData});
});

router.postAsync('/subscriptions-test-user-table/:listCid', passport.loggedIn, async (req, res) => res.json(await subscriptions.listTestUsersDTAjax(req.context, req.params.listCid, req.body)));

router.getAsync('/subscriptions/:listId/:subscriptionId', passport.loggedIn, async (req, res) => {
    const entity = await subscriptions.getById(req.context, castToInteger(req.params.listId), castToInteger(req.params.subscriptionId));
    entity.hash = await subscriptions.hashByList(castToInteger(req.params.listId), entity);
    const decryptedEntity = await engineProvider.decryptInstance(entity, Criteria.SUBSCRIBER);

    return res.json(decryptedEntity);
});

router.postAsync('/subscriptions/:listId', passport.loggedIn, passport.csrfProtection, async (req, res) => res.json(await subscriptions.create(req.context, castToInteger(req.params.listId), req.body, SubscriptionSource.ADMIN_FORM, {})));

router.putAsync('/subscriptions/:listId/:subscriptionId', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    const entity = req.body;
    entity.id = castToInteger(req.params.subscriptionId);

    await subscriptions.updateWithConsistencyCheck(req.context, castToInteger(req.params.listId), entity, SubscriptionSource.ADMIN_FORM);
    return res.json();
});

router.deleteAsync('/subscriptions/:listId/:subscriptionId', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    await subscriptions.remove(req.context, castToInteger(req.params.listId), castToInteger(req.params.subscriptionId));
    return res.json();
});

router.postAsync('/subscriptions-validate/:listId', passport.loggedIn, async (req, res) => res.json(await subscriptions.serverValidate(req.context, castToInteger(req.params.listId), req.body)));

router.postAsync('/subscriptions-unsubscribe/:listId/:subscriptionId', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    await subscriptions.unsubscribeByIdAndGet(req.context, castToInteger(req.params.listId), castToInteger(req.params.subscriptionId));
    return res.json();
});


module.exports = router;
