const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const apiDocs = {
  title: 'ShopLen API Documentation',
  version: '1.0.0',
  description: 'Backend-hosted API docs with request examples and sample responses for current endpoints.',
  baseUrl: '/api',
  groups: [
    {
      name: 'Auth',
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/register',
          summary: 'Register a new user',
          auth: false,
          requestExample: {
            username: 'user123',
            email: 'user@example.com',
            password: 'Password@123',
            phone_number: '0901234567',
            role: 'customer'
          },
          successStatus: 201,
          successExample: {
            message: 'Đăng ký thành công'
          }
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          summary: 'Login with email and password',
          auth: false,
          requestExample: {
            email: 'user@example.com',
            password: 'Password@123'
          },
          successStatus: 200,
          successExample: {
            token: 'jwt-token',
            user: {
              user_id: 1,
              role: 'customer'
            }
          }
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          summary: 'Logout current session',
          auth: false,
          requestExample: {},
          successStatus: 200,
          successExample: {
            message: 'Đăng xuất thành công'
          }
        },
        {
          method: 'GET',
          path: '/api/auth/google',
          summary: 'Start Google login',
          auth: false,
          requestExample: null,
          successStatus: 302,
          successExample: {
            redirect: 'https://accounts.google.com/o/oauth2/v2/auth'
          }
        },
        {
          method: 'GET',
          path: '/api/auth/google/callback',
          summary: 'Handle Google OAuth callback',
          auth: false,
          requestExample: {
            code: 'google-auth-code',
            state: 'google-state-token'
          },
          successStatus: 302,
          successExample: {
            redirect: 'FRONTEND_URL/login?token=...&role=...&user_id=...'
          }
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          summary: 'Get current authenticated user',
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            user_id: 1,
            username: 'user123',
            email: 'user@example.com',
            phone_number: '0901234567',
            role: 'customer',
            first_name: 'John',
            last_name: 'Doe'
          }
        },
        {
          method: 'POST',
          path: '/api/auth/forgot-password',
          summary: 'Send password reset OTP',
          auth: false,
          requestExample: {
            email: 'user@example.com'
          },
          successStatus: 200,
          successExample: {
            message: 'Mã OTP đã được gửi',
            reset_token_id: 12,
            expires_at: '2026-04-28T10:30:00.000Z'
          }
        },
        {
          method: 'POST',
          path: '/api/auth/verify-reset-otp',
          summary: 'Verify OTP and get reset session token',
          auth: false,
          requestExample: {
            email: 'user@example.com',
            otp: '123456'
          },
          successStatus: 200,
          successExample: {
            message: 'OTP hợp lệ',
            reset_session_token: 'jwt-reset-session-token'
          }
        },
        {
          method: 'POST',
          path: '/api/auth/reset-password',
          summary: 'Reset password with reset session token',
          auth: false,
          requestExample: {
            email: 'user@example.com',
            new_password: 'NewPassword@123',
            reset_session_token: 'jwt-reset-session-token'
          },
          successStatus: 200,
          successExample: {
            message: 'Đặt lại mật khẩu thành công'
          }
        }
      ]
    },
    {
      name: 'Users',
      endpoints: [
        {
          method: 'GET',
          path: '/api/users',
          summary: 'List users',
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: [
            {
              user_id: 1,
              username: 'user123',
              email: 'user@example.com',
              phone_number: '0901234567',
              role: 'customer'
            }
          ]
        },
        {
          method: 'GET',
          path: '/api/users/:user_id',
          summary: 'Get user detail by id',
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            user_id: 1,
            username: 'user123',
            email: 'user@example.com',
            phone_number: '0901234567',
            role: 'customer'
          }
        },
        {
          method: 'POST',
          path: '/api/users/change-password',
          summary: 'Change password for current user',
          auth: true,
          requestExample: {
            currentPassword: 'Password@123',
            newPassword: 'NewPassword@123',
            confirmPassword: 'NewPassword@123'
          },
          successStatus: 200,
          successExample: {
            message: 'Đổi mật khẩu thành công'
          }
        }
      ]
    },
    {
      name: 'Categories',
      endpoints: [
        {
          method: 'GET',
          path: '/api/categories',
          summary: 'List categories',
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: [
            {
              category_id: 1,
              category_name: 'Electronics',
              description: 'Devices and gadgets',
              parent_category_id: null,
              slug: 'electronics',
              parent_category_name: null,
              children_count: 0
            }
          ]
        },
        {
          method: 'GET',
          path: '/api/categories/:category_id',
          summary: 'Get category detail by id',
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            category_id: 1,
            category_name: 'Electronics',
            description: 'Devices and gadgets',
            parent_category_id: null,
            slug: 'electronics',
            parent_category_name: null
          }
        },
        {
          method: 'POST',
          path: '/api/categories',
          summary: 'Create a category or bulk-create a tree of categories',
          auth: false,
          requestExample: {
            category_name: 'Sợi Len',
            description: 'Danh mục chính cho sợi len',
            children: [
              {
                category_name: 'Sợi len bông',
                description: 'Sợi len làm từ cotton',
                children: [
                  { category_name: 'Sợi len bông - mịn' },
                  { category_name: 'Sợi len bông - thô' }
                ]
              },
              {
                category_name: 'Sợi len acrylic',
                description: 'Sợi len acrylic phổ biến',
                children: [
                  { category_name: 'Sợi len acrylic - 4 ply' },
                  { category_name: 'Sợi len acrylic - 8 ply' }
                ]
              }
            ]
          },
          successStatus: 201,
          successExample: {
            message: 'Tạo danh mục thành công',
            category: {
              category_id: 1,
              category_name: 'Sợi Len',
              description: 'Danh mục chính cho sợi len',
              parent_category_id: null,
              slug: 'soi-len'
            }
          }
        },
        {
          method: 'PUT',
          path: '/api/categories/:category_id',
          summary: 'Update a category',
          auth: false,
          requestExample: {
            category_name: 'Updated Electronics',
            description: 'Updated description',
            parent_category_id: null
          },
          successStatus: 200,
          successExample: {
            message: 'Cập nhật danh mục thành công',
            category: {
              category_id: 1,
              category_name: 'Updated Electronics',
              description: 'Updated description',
              parent_category_id: null,
              slug: 'updated-electronics'
            }
          }
        },
        {
          method: 'DELETE',
          path: '/api/categories/:category_id',
          summary: 'Delete a category',
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            message: 'Xóa danh mục thành công'
          }
        }
      ]
    }
  ]
};

const renderCodeBlock = (value) => `<pre class="code">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;

const renderDocsPage = () => {
  const sections = apiDocs.groups.map((group) => `
    <section class="group">
      <h2>${escapeHtml(group.name)}</h2>
      ${group.endpoints.map((endpoint) => `
        <article class="endpoint">
          <div class="endpoint-head">
            <span class="method method-${endpoint.method.toLowerCase()}">${escapeHtml(endpoint.method)}</span>
            <code>${escapeHtml(endpoint.path)}</code>
          </div>
          <p class="summary">${escapeHtml(endpoint.summary)}</p>
          <div class="meta">
            <span>${endpoint.auth ? 'Requires auth' : 'Public'}</span>
            <span>Success: ${endpoint.successStatus}</span>
          </div>
          <div class="grid">
            <div>
              <h3>Request example</h3>
              ${endpoint.requestExample === null ? '<p class="muted">No body required.</p>' : renderCodeBlock(endpoint.requestExample)}
            </div>
            <div>
              <h3>Success response</h3>
              ${renderCodeBlock(endpoint.successExample)}
            </div>
          </div>
        </article>
      `).join('')}
    </section>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(apiDocs.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --panel: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --border: #e5e7eb;
      --accent: #0f766e;
      --accent-2: #1d4ed8;
      --danger: #b91c1c;
      --shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
      color: var(--text);
    }
    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 56px;
    }
    .hero {
      background: rgba(255,255,255,0.88);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 24px;
    }
    .hero h1 { margin: 0 0 10px; font-size: 32px; }
    .hero p { margin: 0; color: var(--muted); line-height: 1.6; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff;
      border: 1px solid var(--border);
      font-size: 14px;
    }
    .group {
      margin-top: 24px;
      background: rgba(255,255,255,0.78);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 20px;
      box-shadow: var(--shadow);
    }
    .group h2 { margin: 0 0 16px; font-size: 24px; }
    .endpoint {
      border-top: 1px solid var(--border);
      padding-top: 20px;
      margin-top: 20px;
    }
    .endpoint:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
    .endpoint-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .method {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 72px;
      padding: 6px 10px;
      border-radius: 999px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .method-get { background: var(--accent-2); }
    .method-post { background: var(--accent); }
    .method-put { background: #c2410c; }
    .method-delete { background: var(--danger); }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
    .summary { margin: 0 0 10px; color: var(--text); font-weight: 600; }
    .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; color: var(--muted); font-size: 14px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 12px;
    }
    h3 { margin: 0 0 10px; font-size: 16px; }
    .code {
      margin: 0;
      padding: 14px;
      border-radius: 14px;
      background: #0f172a;
      color: #e2e8f0;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 13px;
      line-height: 1.6;
    }
    .muted { color: var(--muted); }
    .errors { display: grid; gap: 12px; }
    .error-item {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      background: #fff;
    }
    .error-item strong { display: inline-block; margin-bottom: 8px; }
    @media (max-width: 640px) {
      .hero h1 { font-size: 26px; }
      .wrap { padding: 18px 14px 40px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>${escapeHtml(apiDocs.title)}</h1>
      <p>${escapeHtml(apiDocs.description)}</p>
      <div class="chips">
        <span class="chip"><strong>Version</strong> ${escapeHtml(apiDocs.version)}</span>
        <span class="chip"><strong>Base URL</strong> ${escapeHtml(apiDocs.baseUrl)}</span>
        <span class="chip"><strong>Raw spec</strong> <a href="/api/docs.json">/api/docs.json</a></span>
      </div>
    </section>
    ${sections}
  </main>
</body>
</html>`;
};

module.exports = {
  apiDocs,
  renderDocsPage,
};