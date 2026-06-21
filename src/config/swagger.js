const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { apiDocs } = require('../docs/apiDocs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tài liệu API ShopLen',
      version: '1.0.0',
      description: 'Tài liệu API tương tác trực tiếp cho dự án ShopLen.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Đăng ký, đăng nhập và xác thực' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Cart', description: 'Giỏ hàng của khách hàng' },
      { name: 'Wishlist', description: 'Danh sách yêu thích' },
      { name: 'Orders', description: 'Quản lý đơn hàng' },
      { name: 'Payment', description: 'Xử lý thanh toán và hoàn tiền' },
      { name: 'Inventory', description: 'Quản lý tồn kho' },
      { name: 'Delivery', description: 'Quản lý shipper và giao hàng' },
      { name: 'Variants', description: 'Quản lý biến thể sản phẩm' },
      { name: 'Products', description: 'Quản lý thông tin sản phẩm' },
      { name: 'Categories', description: 'Quản lý danh mục sản phẩm' },
      { name: 'Promotions', description: 'Quản lý chương trình khuyến mãi' },
      { name: 'Vouchers', description: 'Quản lý mã giảm giá' },
      { name: 'Location', description: 'Danh sách thành phố, quận/huyện, phường/xã' },
      { name: 'Workshops', description: 'Quản lý workshop và khóa học' },
    ],
  },
  apis: ['./src/routes/*.js'], 
};

const tagOrder = {
  Auth: 1,
  Users: 2,
  Cart: 3,
  Wishlist: 4,
  Orders: 5,
  Payment: 6,
  Inventory: 7,
  Delivery: 8,
  Variants: 9,
  Products: 10,
  Categories: 11,
  Promotions: 12,
  Vouchers: 13,
  Location: 14,
  Workshops: 15,
};

const normalizeApiPath = (apiPath, baseUrl = '') => {
  let normalized = apiPath;

  if (baseUrl && normalized.startsWith(baseUrl)) {
    normalized = normalized.slice(baseUrl.length);
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized.replace(/:([^/]+)/g, '{$1}');
};

const applyApiDocsExamples = (spec, apiDocsData) => {
  if (!spec.paths || !Array.isArray(apiDocsData.groups)) return;

  apiDocsData.groups.forEach((group) => {
    if (!Array.isArray(group.endpoints)) return;

    group.endpoints.forEach((endpoint) => {
      const pathKey = normalizeApiPath(endpoint.path, apiDocsData.baseUrl);
      const method = (endpoint.method || 'get').toLowerCase();
      const operation = spec.paths?.[pathKey]?.[method];
      if (!operation) return;

      if (endpoint.requestExample != null) {
        const hasBodyMethod = ['post', 'put', 'patch', 'delete'].includes(method);
        if (hasBodyMethod) {
          if (!operation.requestBody) {
            operation.requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    example: endpoint.requestExample,
                  },
                },
              },
            };
          } else {
            const content = operation.requestBody.content || {};
            const jsonContent = content['application/json'] || { schema: { type: 'object' } };
            jsonContent.schema = jsonContent.schema || { type: 'object' };
            jsonContent.schema.example = endpoint.requestExample;
            content['application/json'] = jsonContent;
            operation.requestBody.content = content;
          }
        } else if (Array.isArray(operation.parameters)) {
          operation.parameters.forEach((param) => {
            if (Object.prototype.hasOwnProperty.call(endpoint.requestExample, param.name)) {
              param.example = endpoint.requestExample[param.name];
            }
          });
        }
      }

      if (endpoint.successExample != null) {
        const statusCode = String(endpoint.successStatus || 200);
        if (!operation.responses[statusCode]) {
          operation.responses[statusCode] = { description: 'Success' };
        }
        const response = operation.responses[statusCode];
        const content = response.content || {};
        const jsonContent = content['application/json'] || { schema: { type: 'object' } };
        jsonContent.schema = jsonContent.schema || { type: 'object' };
        jsonContent.schema.example = endpoint.successExample;
        content['application/json'] = jsonContent;
        response.content = content;
      }
    });
  });
};

const swaggerSpec = swaggerJSDoc(options);
applyApiDocsExamples(swaggerSpec, apiDocs);

const swaggerDocs = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: (a, b) => {
        const nameA = typeof a === 'string' ? a : a.name;
        const nameB = typeof b === 'string' ? b : b.name;
        const orderA = tagOrder[nameA] || 999;
        const orderB = tagOrder[nameB] || 999;
        return orderA - orderB;
      },
    },
  }));

  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = swaggerDocs;