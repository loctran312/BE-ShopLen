const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const apiDocs = {
  title: "Tài liệu API ShopLen",
  version: "1.0.0",
  description:
    "Tài liệu API hiển thị ví dụ request và response cho các endpoint hiện tại. Tên bảng/cột nội bộ đã được Việt hóa, nhưng field API vẫn giữ nguyên để tương thích frontend.",
  baseUrl: "/api",
  groups: [
    {
      name: "Xác thực",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/register",
          summary: "Đăng ký tài khoản mới",
          auth: false,
          requestExample: {
            username: "user123",
            email: "user@example.com",
            password: "Password@123",
            phone_number: "0901234567",
            role: "customer",
          },
          successStatus: 201,
          successExample: {
            message: "Đăng ký thành công",
          },
        },
        {
          method: "POST",
          path: "/api/auth/login",
          summary: "Đăng nhập bằng email và mật khẩu",
          auth: false,
          requestExample: {
            email: "user@example.com",
            password: "Password@123",
          },
          successStatus: 200,
          successExample: {
            access_token: "jwt-access-token",
            refresh_token: "jwt-refresh-token",
            user: {
              user_id: 1,
              role: "customer",
            },
          },
        },
        {
          method: "POST",
          path: "/api/auth/refresh-token",
          summary: "Lấy access token mới bằng refresh token",
          auth: false,
          requestExample: {
            refresh_token: "jwt-refresh-token",
          },
          successStatus: 200,
          successExample: {
            access_token: "jwt-access-token",
            refresh_token: "jwt-refresh-token",
          },
        },
        {
          method: "GET",
          path: "/api/auth/google",
          summary: "Bắt đầu đăng nhập bằng Google",
          auth: false,
          requestExample: null,
          successStatus: 302,
          successExample: {
            redirect: "https://accounts.google.com/o/oauth2/v2/auth",
          },
        },
        {
          method: "GET",
          path: "/api/auth/google/callback",
          summary: "Xử lý callback từ Google OAuth",
          auth: false,
          requestExample: {
            code: "google-auth-code",
            state: "google-state-token",
          },
          successStatus: 302,
          successExample: {
            redirect:
              "FRONTEND_URL/login?access_token=...&refresh_token=...&role=...&user_id=...",
          },
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          summary: "Đăng xuất phiên hiện tại",
          auth: false,
          requestExample: {},
          successStatus: 200,
          successExample: {
            message: "Đăng xuất thành công",
          },
        },
        {
          method: "GET",
          path: "/api/auth/me",
          summary: "Lấy thông tin người dùng hiện tại",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            user_id: 1,
            username: "user123",
            email: "user@example.com",
            phone_number: "0901234567",
            role: "customer",
            first_name: "John",
            last_name: "Doe",
          },
        },
        {
          method: "POST",
          path: "/api/auth/forgot-password",
          summary: "Gửi OTP đặt lại mật khẩu",
          auth: false,
          requestExample: {
            email: "user@example.com",
          },
          successStatus: 200,
          successExample: {
            message: "Mã OTP đã được gửi",
            reset_token_id: 12,
            expires_at: "2026-04-28T10:30:00.000Z",
          },
        },
        {
          method: "POST",
          path: "/api/auth/verify-reset-otp",
          summary: "Xác thực OTP và lấy token phiên đặt lại",
          auth: false,
          requestExample: {
            email: "user@example.com",
            otp: "123456",
          },
          successStatus: 200,
          successExample: {
            message: "OTP hợp lệ",
            reset_session_token: "jwt-reset-session-token",
          },
        },
        {
          method: "POST",
          path: "/api/auth/reset-password",
          summary: "Đặt lại mật khẩu bằng token phiên",
          auth: false,
          requestExample: {
            email: "user@example.com",
            new_password: "NewPassword@123",
            reset_session_token: "jwt-reset-session-token",
          },
          successStatus: 200,
          successExample: {
            message: "Đặt lại mật khẩu thành công",
          },
        },
      ],
    },
    {
      name: "Người dùng",
      endpoints: [
        {
          method: "GET",
          path: "/api/users",
          summary: "Lấy danh sách người dùng",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: [
            {
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
        "user_id": 4,
        "username": "username",
        "first_name": "user",
        "last_name": "name",
        "email": "user@gmail.com",
        "phone_number": "0912345678",
        "status": "active",
        "role": "customer"
      },
      {
        "user_id": 3,
        "username": "admin2",
        "first_name": "Admin",
        "last_name": "2",
        "email": "admin@gmail.com",
        "phone_number": "0900000002",
        "status": "active",
        "role": "admin"
      },
      ],
    "pagination": {
      "total_items": 4,
      "total_pages": 1,
      "current_page": 1,
      "limit": 10
    }
  }}
          ],
        },
        {
          method: "GET",
          path: "/api/users/:user_id",
          summary: "Lấy chi tiết người dùng theo id",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            user_id: 1,
            username: "user123",
            email: "user@example.com",
            phone_number: "0901234567",
            role: "customer",
          },
        },
        {
          method: "POST",
          path: "/api/users",
          summary: "Tạo người dùng bằng quyền admin",
          auth: true,
          requestExample: {
            username: "newuser",
            email: "newuser@example.com",
            password: "Password@123",
            phone_number: "0901234567",
            first_name: "New",
            last_name: "User",
            role: "customer",
          },
          successStatus: 201,
          successExample: {
            message: "Tạo người dùng thành công",
            user: {
              user_id: 2,
              username: "newuser",
              first_name: "New",
              last_name: "User",
              email: "newuser@example.com",
              phone_number: "0901234567",
              status: "active",
              role: "customer",
            },
          },
        },
        {
          method: "PUT",
          path: "/api/users/:user_id",
          summary: "Cập nhật người dùng bằng quyền admin",
          auth: true,
          requestExample: {
            username: "updateduser",
            email: "updated@example.com",
            phone_number: "0901234567",
            first_name: "Updated",
            last_name: "User",
            status: "active",
            role: "customer",
          },
          successStatus: 200,
          successExample: {
            message: "Cập nhật người dùng thành công",
            user: {
              user_id: 2,
              username: "updateduser",
              first_name: "Updated",
              last_name: "User",
              email: "updated@example.com",
              phone_number: "0901234567",
              status: "active",
              role: "customer",
            },
          },
        },
        {
          method: "PUT",
          path: "/api/users/user/me",
          summary: "Cập nhật thông tin người dùng hiện tại",
          auth: true,
          requestExample: {
            username: "username",
            email: "user@gmail.com",
            first_name: "user",
            last_name: "name",
            phone_number: "0912345678"
          },
          successStatus: 200,
          successExample: {
            "message": "Cập nhật thông tin thành công",
            "user": {
              "user_id": 4,
              "username": "username",
              "first_name": "user",
              "last_name": "name",
              "email": "user@gmail.com",
              "phone_number": "0912345678",
              "status": "active",
              "role": "customer"
            }
          },
        },
        {
          method: "DELETE",
          path: "/api/users/:user_id",
          summary: "Xóa người dùng bằng quyền admin",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            message: "Xóa người dùng thành công",
          },
        },
        {
          method: "POST",
          path: "/api/users/change-password",
          summary: "Đổi mật khẩu cho người dùng hiện tại",
          auth: true,
          requestExample: {
            currentPassword: "Password@123",
            newPassword: "NewPassword@123",
            confirmPassword: "NewPassword@123",
          },
          successStatus: 200,
          successExample: {
            message: "Đổi mật khẩu thành công",
          },
        },
      ],
    },
    {
      name: "Sản phẩm",
      endpoints: [
        {
          method: "GET",
          path: "/api/products/types",
          summary: "Lấy danh sách loại sản phẩm",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: [
            {
              type_id: 1,
              type_name: "Sợi len",
              description: "Các loại sợi len dùng để đan móc",
            },
            {
              type_id: 2,
              type_name: "Phụ kiện đan móc",
              description:
                "Các loại phụ kiện đi kèm như kim đan, kim móc, thước dây...",
            },
            {
              type_id: 3,
              type_name: "Workshop",
              description: "Các lớp học đan móc trực tiếp tại cửa hàng",
            },
          ],
        },
        {
          method: "GET",
          path: "/api/products",
          summary: "Lấy danh sách sản phẩm kèm biến thể và ảnh",
          auth: false,
          requestExample: {
            page: 1,
            limit: 10,
          },
          successStatus: 200,
          successExample: {
            success: true,
            message: "Lấy danh sách sản phẩm thành công",
            data: {
              products: [
                {
                  product_id: 1,
                  product_name: "Cuộn len Cotton Milk 50g",
                  category_name: "Len sợi",
                  type_name: "Sợi len",
                  product_status: "active",
                  variants: [
                    {
                      variant_id: 1,
                      sku: "LEN-CM-RED-50G",
                      slug: "cuon-len-cotton-milk-50g-mau-do",
                      price: "15000.00",
                      color: "Đỏ",
                      size: "50g",
                      images: [
                        {
                          image_url: "https://example.com/images/len-red-1.jpg",
                          sort_order: 1,
                        },
                        {
                          image_url: "https://example.com/images/len-red-2.jpg",
                          sort_order: 2,
                        },
                      ],
                    },
                  ],
                },
              ],
              pagination: {
                total_items: 125,
                total_pages: 13,
                current_page: 1,
                limit: 10,
              },
            },
          },
        },
        {
          method: "GET",
          path: "/api/products/:product_id",
          summary: "Lấy chi tiết sản phẩm",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            success: true,
            message: "Lấy chi tiết sản phẩm thành công",
            data: {
              product: {
                product_id: 1,
                type_id: 1,
                category_id: 2,
                product_name: "Cuộn len Cotton Milk 50g",
                description: "Len sợi mềm mại...",
                product_status: "active",
                category_name: "Len sợi",
                type_name: "Sợi len",
                variants: [
                  {
                    variant_id: 1,
                    sku: "LEN-CM-RED-50G",
                    slug: "cuon-len-cotton-milk-50g-mau-do",
                    price: "15000.00",
                    color: "Đỏ",
                    size: "50g",
                    stock_quantity: 150,
                    images: [
                      {
                        image_url: "https://i.ibb.co/example.jpg",
                        sort_order: 1,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        {
          method: "POST",
          auth: true,
          path: "/api/products",
          summary: "Tạo sản phẩm mới kèm biến thể và ảnh",
          requestExample: {
            type_id: 1,
            category_id: 2,
            product_name: "Cuộn len Cotton Milk 50g",
            description:
              "Len sợi mềm mại, an toàn cho da em bé. Thích hợp đan móc thú bông, áo len...",
            product_status: "active",
            variants: [
              {
                sku: "LEN-CM-RED-50G",
                price: 15000,
                color: "Đỏ",
                size: "50g",
                stock_quantity: 150,
                images: [
                  {
                    image_url: "https://example.com/images/len-red-1.jpg",
                    sort_order: 1,
                  },
                  {
                    image_url: "https://example.com/images/len-red-2.jpg",
                    sort_order: 2,
                  },
                ],
              },
            ],
          },
          successStatus: 201,
          successExample: {
            success: true,
            message: "Tạo sản phẩm thành công",
            data: {
              product: {
                product_id: 1,
              },
            },
          },
        },
        {
          method: "PUT",
          path: "/api/products/:product_id",
          summary: "Cập nhật sản phẩm và tùy chọn biến thể",
          auth: true,
          requestExample: {
            product_name: "Cuộn len Cotton Milk 50g - mới",
            product_status: "active",
            variants: [
              {
                variant_id: 1,
                sku: "LEN-CM-RED-50G",
                price: 16000,
                color: "Đỏ",
                size: "50g",
                stock_quantity: 120,
                images: [
                  {
                    image_url: "https://example.com/images/len-red-1.jpg",
                    sort_order: 1,
                  },
                ],
              },
            ],
          },
          successStatus: 200,
          successExample: {
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: {
              product: {
                product_id: 1,
              },
            },
          },
        },
        {
          method: "DELETE",
          path: "/api/products/:product_id",
          summary: "Xóa sản phẩm",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            success: true,
            message: "Xóa sản phẩm thành công",
          },
        },
        {
          method: "DELETE",
          path: "/api/variants/:variant_id",
          summary: "Xóa biến thể",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            success: true,
            message: "Xóa biến thể thành công",
          },
        },
        {
          method: "PATCH",
          path: "/api/variants/:variant_id/stock",
          summary: "Cập nhật số lượng tồn kho của biến thể",
          auth: true,
          requestExample: {
            newStock: 100,
          },
          successStatus: 200,
          successExample: {
            success: true,
            message: "Cập nhật tồn kho thành công",
            data: {
              variantId: 1,
              stock_quantity: 100,
            },
          },
        },
        {
          method: "PATCH",
          path: "/api/variants/:variant_id/stock-change",
          summary: "Điều chỉnh số lượng tồn kho của biến thể (tăng/giảm)",
          auth: true,
          requestExample: {
            stock_quantity: +100,
          },
          successStatus: 200,
          successExample: {
            success: true,
            message: "Cập nhật thay đổi tồn kho thành công",
            data: {
              variantId: 1,
              stock_quantity: 200,
            },
          },
        },
      ],
    },
    {
      name: "Danh mục",
      endpoints: [
        {
          method: "GET",
          path: "/api/categories",
          summary: "Lấy danh sách danh mục theo cây",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: [
            {
              "success": true,
              "message": "Lấy danh sách danh mục thành công",
              "data": {
                "categories": [
                  {
                    "id": 1,
                    "category_name": "Len đan",
                    "description": "",
                    "image_url": null,
                    "slug": "len-dan",
                    "children": [
                      {
                        "id": 2,
                        "category_name": "Len Cotton",
                        "description": "",
                        "image_url": null,
                        "slug": "len-cotton",
                        "children": []
                      }
                    ]
                  }
                ],
                "pagination": {
                  "total_items": 1,
                  "total_pages": 1,
                  "current_page": 1,
                  "limit": 10
                }
              }
            }
          ],
        },
        {
          method: "GET",
          path: "/api/categories/:category_id",
          summary: "Lấy chi tiết danh mục theo id dưới dạng cây con",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            id: 1,
            category_name: "Sợi Len",
            description: "Danh mục chính cho sợi len",
            image_url: null,
            slug: "soi-len",
            children: [
              {
                id: 2,
                category_name: "Sợi len bông",
                description: "Sợi len làm từ cotton",
                image_url: null,
                slug: "soi-len-bong",
                children: [
                  {
                    id: 3,
                    category_name: "Sợi len bông - mịn",
                    description: "Sợi len làm từ cotton mịn",
                    image_url: null,
                    slug: "soi-len-bong-min",
                    children: [],
                  },
                  {
                    id: 4,
                    category_name: "Sợi len bông - thô",
                    description: "Sợi len làm từ cotton thô",
                    image_url: null,
                    slug: "soi-len-bong-tho",
                    children: [],
                  },
                ],
              },
            ],
          },
        },
        {
          method: "POST",
          path: "/api/categories",
          summary: "Tạo danh mục hoặc tạo hàng loạt theo cây",
          auth: true,
          requestExample: {
            category_name: "Sợi Len",
            description: "Danh mục chính cho sợi len",
            image_url: "https://i.ibb.co/example.jpg",
            children: [
              {
                category_name: "Sợi len bông",
                description: "Sợi len làm từ cotton",
                children: [
                  { category_name: "Sợi len bông - mịn" },
                  { category_name: "Sợi len bông - thô" },
                ],
              },
              {
                category_name: "Sợi len acrylic",
                description: "Sợi len acrylic phổ biến",
                children: [
                  { category_name: "Sợi len acrylic - 4 ply" },
                  { category_name: "Sợi len acrylic - 8 ply" },
                ],
              },
            ],
          },
          successStatus: 201,
          successExample: {
            message: "Tạo danh mục thành công",
            category: {
              category_id: 1,
              category_name: "Sợi Len",
              description: "Danh mục chính cho sợi len",
              image_url: "https://i.ibb.co/example.jpg",
              parent_category_id: null,
              slug: "soi-len",
            },
          },
        },
        {
          method: "POST",
          path: "/api/categories",
          summary: "Tạo danh mục con dưới một danh mục cha đã tồn tại",
          auth: true,
          requestExample: {
            category_name: "Sợi len dệt tay",
            description: "Các loại sợi chuyên dùng để dệt tay thủ công",
            image_url: null,
            parent_category_id: 1,
          },
          successStatus: 201,
          successExample: {
            message: "Tạo danh mục thành công",
            category: {
              category_id: 15,
              category_name: "Sợi len dệt tay",
              description: "Các loại sợi chuyên dùng để dệt tay thủ công",
              image_url: "https://i.ibb.co/xxxxx/image.jpg",
              parent_category_id: 1,
              slug: "soi-len-det-tay",
            },
          },
        },

        {
          method: "PUT",
          path: "/api/categories/:category_id",
          summary: "Cập nhật danh mục",
          auth: true,
          requestExample: {
            category_name: "Điện tử đã cập nhật",
            description: "Mô tả đã cập nhật",
            image_url: "https://i.ibb.co/example-updated.jpg",
            parent_category_id: null,
          },
          successStatus: 200,
          successExample: {
            message: "Cập nhật danh mục thành công",
            category: {
              category_id: 1,
              category_name: "Điện tử đã cập nhật",
              description: "Mô tả đã cập nhật",
              image_url: "https://i.ibb.co/example-updated.jpg",
              parent_category_id: null,
              slug: "dien-tu-da-cap-nhat",
            },
          },
        },
        {
          method: "DELETE",
          path: "/api/categories/:category_id",
          summary: "Xóa danh mục",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            message: "Xóa danh mục thành công",
          },
        },
      ],
    },
    {
      name: "Địa điểm",
      endpoints: [
        {
          method: "GET",
          path: "/api/location/cities",
          summary: "Lấy danh sách tỉnh/thành",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            success: true,
            message: "Lấy danh sách tỉnh/thành thành công",
            data: {
              cities: [
                {
                  city_code: "HCM",
                  city_name: "Hồ Chí Minh",
                },
                {
                  city_code: "HN",
                  city_name: "Hà Nội",
                },
                {
                  city_code: "DN",
                  city_name: "Đà Nẵng",
                },
                {
                  city_code: "HP",
                  city_name: "Hải Phòng",
                },
                {
                  city_code: "CT",
                  city_name: "Cần Thơ",
                },
              ],
            },
          },
        },
        {
          method: "GET",
          path: "/api/location/cities/:city_code/wards",
          summary: "Lấy danh sách phường/xã theo mã tỉnh/thành",
          auth: false,
          requestExample: null,
          successStatus: 200,
          successExample: {
            success: true,
            message: "Lấy danh sách phường/xã thành công",
            data: {
              wards: [
                {
                  ward_code: 1,
                  ward_name: "Phường Bến Nghé",
                },
                {
                  ward_code: 2,
                  ward_name: "Phường Bến Thành",
                },
                {
                  ward_code: 3,
                  ward_name: "Phường Đa Kao",
                },
                {
                  ward_code: 4,
                  ward_name: "Phường Phạm Ngũ Lão",
                },
                {
                  ward_code: 5,
                  ward_name: "Phường Tân Định",
                },
              ],
            },
          },
        },
      ],
    },
    {
      name: "Giỏ hàng",
      endpoints: [
        {
          method: "GET",
          path: "/api/cart",
          summary: "Lấy thông tin giỏ hàng của người dùng hiện tại",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            "success": true,
            "message": "Lấy danh sách giỏ hàng thành công",
            "data": {
              "cart": [
                {
                  "cart_id": 1,
                  "variant_id": 1,
                  "quantity": 7,
                  "sku": "L-COTTON-001",
                  "slug": "len-cotton-milk-trang",
                  "price": "25000.00",
                  "color": "Trắng",
                  "size": null,
                  "product_id": 1,
                  "product_name": "Len Cotton Milk",
                  "stock_quantity": 100,
                  "image_url": null
                }
              ]
            }
          }
        },
        {
          method: "POST",
          path: "/api/cart",
          summary: "Thêm sản phẩm vào giỏ hàng",
          auth: true,
          requestExample: {
            variant_id: 1,
            quantity: 2,
          },
          successStatus: 200,
          successExample: {
            "success": true,
            "message": "Thêm sản phẩm vào giỏ hàng thành công",
            "data": {
              "item": {
                "gio_hang_id": 1,
                "bien_the_id": 1,
                "quantity": 9
              }
            }
          }
        },
        {
          method: "PUT",
          path: "/api/cart/:variant_id",
          summary: "Cập nhật số lượng sản phẩm trong giỏ hàng",
          auth: true,
          requestExample: {
            quantity: 2,
          },
          successStatus: 200,
          successExample: {
            "success": true,
            "message": "Cập nhật số lượng thành công",
            "data": {
              "item": {
                "gio_hang_id": 1,
                "bien_the_id": 1,
                "quantity": 2
              }
            }
          }
        },
        {
          method: "POST",
          path: "/api/cart/sync",
          summary: "Đồng bộ giỏ hàng khi người dùng đăng nhập từ trạng thái guest",
          auth: true,
          requestExample: {
            "local_cart": [
              {
                "variant_id": 1,
                "quantity": 2
              },
              {
                "variant_id": 3,
                "quantity": 1
              }
            ]
          },
          successStatus: 200,
          successExample: {
            "success": true,
            "message": "Đồng bộ giỏ hàng thành công",
            "data": {
              "cart": [
                {
                  "cart_id": 1,
                  "variant_id": 1,
                  "quantity": 4,
                  "sku": "L-COTTON-001",
                  "slug": "len-cotton-milk-trang",
                  "price": "25000.00",
                  "color": "Trắng",
                  "size": null,
                  "product_id": 1,
                  "product_name": "Len Cotton Milk",
                  "stock_quantity": 100,
                  "image_url": null
                }
              ]
            }
          }
        },
        {
          method: "DELETE",
          path: "/api/cart/:variant_id",
          summary: "Xóa sản phẩm khỏi giỏ hàng",
          auth: true,
          requestExample: null,
          successStatus: 200,
          successExample: {
            "success": true,
            "message": "Xóa sản phẩm khỏi giỏ hàng thành công",
          }
        }
      ]
    }
  ],
};

const renderCodeBlock = (value) =>
  `<pre class="code">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;

const renderDocsPage = () => {
  const sections = apiDocs.groups
    .map(
      (group) => `
    <section class="group">
      <h2>${escapeHtml(group.name)}</h2>
      ${group.endpoints
        .map(
          (endpoint) => `
        <article class="endpoint">
          <div class="endpoint-head">
            <span class="method method-${endpoint.method.toLowerCase()}">${escapeHtml(endpoint.method)}</span>
            <code>${escapeHtml(endpoint.path)}</code>
          </div>
          <p class="summary">${escapeHtml(endpoint.summary)}</p>
          <div class="meta">
            <span>${endpoint.auth ? "Cần xác thực" : "Công khai"}</span>
            <span>Mã thành công: ${endpoint.successStatus}</span>
          </div>
          <div class="grid">
            <div>
              <h3>Ví dụ request</h3>
              ${endpoint.requestExample === null ? '<p class="muted">Không cần body.</p>' : renderCodeBlock(endpoint.requestExample)}
            </div>
            <div>
              <h3>Ví dụ response thành công</h3>
              ${renderCodeBlock(endpoint.successExample)}
            </div>
          </div>
        </article>
      `,
        )
        .join("")}
    </section>
  `,
    )
    .join("");

  return `<!doctype html>
  <html lang="vi">
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
        <span class="chip"><strong>Phiên bản</strong> ${escapeHtml(apiDocs.version)}</span>
        <span class="chip"><strong>Base URL</strong> ${escapeHtml(apiDocs.baseUrl)}</span>
        <span class="chip"><strong>Spec JSON</strong> <a href="/api/docs.json">/api/docs.json</a></span>
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
