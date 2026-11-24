INSERT INTO roles (name, description)
VALUES
    (
        'Admin',
        'Full access to manage users, datasets, and platform settings.'
    ),
    (
        'Analyst',
        'Access to datasets, analytics, reports, and machine learning tools.'
    ),
    (
        'Viewer',
        'Read-only access to dashboards, reports, and analytics.'
    )
ON CONFLICT (name) DO NOTHING;