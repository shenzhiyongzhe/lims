const data = {
  "data": [
    {
      "user": {
        "id": 1,
        "username": "张三",
        "phone": "12345678911",
        "address": "广东深圳",
        "lv": "青铜用户"
      },
      loanAccount: [{
        "id": 1,
        "user_id": 1,
        "loan_amount": "3000",
        "receiving_amount": "110",
        "capital": "1000",
        "interest": "100",
        "due_start_date": "2025-10-01T06:00:00.000Z",
        "due_end_date": "2025-10-01T06:00:00.000Z",
        "status": "pending",
        "handling_fee": "1000",
        "total_periods": 1,
        "repaid_periods": 1,
        "daily_repayment": "1100",
        "risk_controller": "风控人001",
        "collector": "负责人001",
        "payee": "收款人001",
        "lender": "打款人001",
        "company_cost": 1000,
        "created_at": "2025-09-30T16:40:36.872Z",
        "created_by": 1,
        "updated_at": null,
        "repaymentSchedules": [
          {
            "id": 1,
            "loan_id": 1,
            "period": 1,
            "due_start_date": "2025-10-01T06:00:00.000Z",
            "due_end_date": "2025-10-02T06:00:00.000Z",
            "due_amount": "1100",
            "capital": "1000",
            "interest": "100",
            "status": "paid",
            "paid_amount": "110",
            "paid_at": "2025-09-30T09:48:13.997Z"
          },
          {
            "id": 2,
            "loan_id": 1,
            "period": 2,
            "due_start_date": "2025-10-01T06:00:00.000Z",
            "due_end_date": "2025-10-02T06:00:00.000Z",
            "due_amount": "1100",
            "capital": "1000",
            "interest": "100",
            "status": "paid",
            "paid_amount": "110",
            "paid_at": "2025-09-30T09:48:13.997Z"
          }
        ]
      },
      {
        "id": 2,
        "user_id": 1,
        "loan_amount": "3000",
        "receiving_amount": "110",
        "capital": "1000",
        "interest": "100",
        "due_start_date": "2025-10-01T06:00:00.000Z",
        "due_end_date": "2025-10-01T06:00:00.000Z",
        "status": "pending",
        "handling_fee": "1000",
        "total_periods": 1,
        "repaid_periods": 1,
        "daily_repayment": "1100",
        "risk_controller": "风控人001",
        "collector": "负责人001",
        "payee": "收款人001",
        "lender": "打款人001",
        "company_cost": 1000,
        "created_at": "2025-09-30T16:40:36.872Z",
        "created_by": 1,
        "updated_at": null,
        "repaymentSchedules": [
          {
            "id": 3,
            "loan_id": 2,
            "period": 1,
            "due_start_date": "2025-10-01T06:00:00.000Z",
            "due_end_date": "2025-10-02T06:00:00.000Z",
            "due_amount": "1100",
            "capital": "1000",
            "interest": "100",
            "status": "paid",
            "paid_amount": "110",
            "paid_at": "2025-09-30T09:48:13.997Z"
          },

        ]
      }

      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}