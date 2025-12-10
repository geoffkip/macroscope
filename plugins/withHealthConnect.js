const { withAndroidManifest, withMainActivity, AndroidConfig } = require('@expo/config-plugins');

const withHealthConnectManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults;
        const application = manifest.manifest.application[0];
        const mainActivity = application.activity.find(
            (a) => a.$['android:name'] === '.MainActivity'
        );

        if (mainActivity) {
            // Add Rationale Intent Filter to MainActivity
            const rationaleIntent = {
                action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }]
            };

            // Add VIEW_PERMISSION_USAGE_FOR_PERIOD intent filter (required for Android 14+)
            const permissionUsageIntent = {
                action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE_FOR_PERIOD' } }],
                category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }]
            };

            mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];
            const hasRationale = mainActivity['intent-filter'].some(f =>
                f.action?.some(a => a.$['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE')
            );

            if (!hasRationale) {
                mainActivity['intent-filter'].push(rationaleIntent);
            }

            // Add permission usage intent filter
            const hasPermissionUsage = mainActivity['intent-filter'].some(f =>
                f.action?.some(a => a.$['android:name'] === 'android.intent.action.VIEW_PERMISSION_USAGE_FOR_PERIOD')
            );

            if (!hasPermissionUsage) {
                mainActivity['intent-filter'].push(permissionUsageIntent);
            }
        }

        // Android 16 Fix: Add activity-alias for VIEW_PERMISSION_USAGE
        // This is REQUIRED for the permission sheet to launch on Android 16+
        const activityAlias = {
            $: {
                'android:name': 'ViewPermissionUsageActivity',
                'android:exported': 'true',
                'android:targetActivity': '.MainActivity',
                'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE'
            },
            'intent-filter': [
                {
                    action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
                    category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }]
                }
            ]
        };

        // Check if alias already exists
        application['activity-alias'] = application['activity-alias'] || [];
        const hasAlias = application['activity-alias'].some(
            a => a.$['android:name'] === 'ViewPermissionUsageActivity'
        );

        if (!hasAlias) {
            application['activity-alias'].push(activityAlias);
        }

        // Add Queries (Package Visibility)
        const health_packages = [
            { package: { $: { 'android:name': 'com.google.android.apps.healthdata' } } },
            { package: { $: { 'android:name': 'com.google.android.healthconnect.controller' } } },
        ];

        if (!manifest.manifest.queries) {
            manifest.manifest.queries = health_packages;
        } else {
            health_packages.forEach(pkg => {
                manifest.manifest.queries.push(pkg);
            });
        }

        return config;
    });
};

const withHealthConnectActivity = (config) => {
    return withMainActivity(config, async (config) => {
        const src = config.modResults.contents;
        const permissionDelegateImport = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
        const onCreateHook = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

        // 1. Add Import
        let newSrc = src;
        if (!newSrc.includes(permissionDelegateImport)) {
            newSrc = newSrc.replace(/package com\.geoffreykip\.macroscope/, `package com.geoffreykip.macroscope\n\n${permissionDelegateImport}`);
        }

        // 2. Add Delegate in onCreate
        // Expo generates super.onCreate(null), not super.onCreate(savedInstanceState)
        if (!newSrc.includes(onCreateHook)) {
            // Match both super.onCreate(null) and super.onCreate(savedInstanceState)
            newSrc = newSrc.replace(
                /super\.onCreate\((null|savedInstanceState)\)/,
                `super.onCreate($1)\n    ${onCreateHook}`
            );
        }

        config.modResults.contents = newSrc;
        return config;
    });
};

module.exports = (config) => {
    config = withHealthConnectManifest(config);
    config = withHealthConnectActivity(config);
    return config;
};
