const { caseService, organizationService } = require('../../../app/lib/db');
const _ = require('lodash');
const moment = require('moment');

/**
 * @method fetchOrganization
 *
 * Fetch Organization
 *
 */
exports.fetchOrganizationById = async (req, res) => {
  const {
    user: { organization_id },
  } = req;

  if (!organization_id) throw new Error('Organization ID is missing.');

  const organization = await organizationService.fetchById(organization_id);
  if (organization) {
    res
      .status(200)
      .json(
        _.pick(organization, [
          'id',
          'externalId',
          'name',
          'completedOnboarding',
        ]),
      );
  } else {
    throw new Error(`Could not fetch organization by id ${organization_id}.`);
  }
};

/**
 * @method fetchOrganizationConfig
 *
 * Fetch Organization config information.
 *
 */
exports.fetchOrganizationConfig = async (req, res) => {
  const {
    user: { organization_id },
  } = req;

  if (!organization_id) throw new Error('Organization ID is missing.');

  const organization = await organizationService.fetchById(organization_id);

  let responsePayload = _.pick(organization, [
    'id',
    'externalId',
    'name',
    'completedOnboarding',
    'notificationThresholdPercent',
    'notificationThresholdTimeline',
    'daysToRetainRecords',
    'regionCoordinates',
    'apiEndpointUrl',
    'referenceWebsiteUrl',
    'infoWebsiteUrl',
    'privacyPolicyUrl',
  ]);

  responsePayload.appVersion = process.env.npm_package_version;

  if (organization) {
    res.status(200).json(responsePayload);
  } else {
    throw new Error(
      `Could not fetch organization config by users org id ${organization_id}.`,
    );
  }
};

/**
 * @method updateOrganization
 *
 * Update Organization
 *
 */
exports.updateOrganization = async (req, res) => {
  const {
    user: { organization_id },
    body: organization,
  } = req;

  if (!organization_id) throw new Error('Organization ID is missing.');

  const results = await organizationService.updateOrganization(
    organization_id,
    organization,
  );
  if (results) {
    res.status(200).json(results);
  } else {
    throw new Error(
      `Could not update organization by users org id ${organization_id} and paramaters.`,
    );
  }
};

/**
 * @method fetchOrganizationCases
 *
 * Fetch cases associated with organization.
 * Organization is pulled from the user.
 *
 */
exports.fetchOrganizationCases = async (req, res) => {
  const {
    user: { organization_id },
  } = req;

  if (!organization_id) throw new Error('Organization ID is missing.');

  await organizationService.cleanOutExpiredCases(organization_id);

  const cases = await organizationService.getCases(organization_id);

  res.status(200).json({ cases });
};

/**
 * @method createOrganizationCase
 *
 * Create cases associated with organization.
 * Organization is pulled from the user.
 *
 */
exports.createOrganizationCase = async (req, res) => {
  const {
    user: { id, organization_id },
  } = req;

  if (!id) throw new Error('User ID is missing.');
  if (!organization_id) throw new Error('Organization ID is missing.');

  const organization = await organizationService.fetchById(organization_id);
  if (!organization) throw new Error('Organization could not be found.');

  const newCase = await caseService.createCase({
    contact_tracer_id: id,
    organization_id,
    expires_at: moment()
      .startOf('day')
      .add(organization.daysToRetainRecords, 'days')
      .format(),
    state: 'unpublished',
  });

  if (newCase) {
    res.status(200).json(newCase);
  } else {
    throw new Error(
      `Could not create case by users org id ${organization_id}.`,
    );
  }
};
