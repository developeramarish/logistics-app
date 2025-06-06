import {CommonModule} from "@angular/common";
import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputMaskModule} from "primeng/inputmask";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {RadioButtonModule} from "primeng/radiobutton";
import {AddressFormComponent, ValidationSummaryComponent} from "@/components";
import {ApiService} from "@/core/api";
import {
  AddressDto,
  InvoiceDto,
  PaymentMethodType,
  PaymentStatus,
  PayrollDto,
  ProcessPaymentCommand,
  paymentMethodTypeOptions,
} from "@/core/api/models";
import {REGEX_PATTERNS} from "@/core/constants";
import {ToastService} from "@/core/services";
import {InvoiceDetailsComponent, PayrollDetailsComponent} from "../components";

@Component({
  selector: "app-process-payment",
  standalone: true,
  templateUrl: "./process-payment.component.html",
  imports: [
    CommonModule,
    CardModule,
    ProgressSpinnerModule,
    ReactiveFormsModule,
    ValidationSummaryComponent,
    RadioButtonModule,
    ButtonModule,
    InvoiceDetailsComponent,
    PayrollDetailsComponent,
    InputMaskModule,
    AddressFormComponent,
  ],
})
export class ProcessPaymentComponent implements OnInit {
  public paymentMethod = PaymentMethodType;
  public paymentMethods = paymentMethodTypeOptions;
  public title = "";
  public isLoading = false;
  public isPaymentCompleted = false;
  public form: FormGroup<PaymentForm>;
  public payroll?: PayrollDto;
  public invoice?: InvoiceDto;

  constructor(
    private readonly apiService: ApiService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute
  ) {
    this.form = new FormGroup<PaymentForm>({
      paymentMethod: new FormControl(PaymentMethodType.Card, {
        validators: Validators.required,
        nonNullable: true,
      }),
      cardholderName: new FormControl(null),
      cardNumber: new FormControl(null),
      cardExpirationDate: new FormControl(null),
      cardCvc: new FormControl(null),
      billingAddress: new FormControl(null, {validators: Validators.required}),
      bankName: new FormControl(null),
      bankAccountNumber: new FormControl(null),
      bankRoutingNumber: new FormControl(null),
    });

    this.form.get("paymentMethod")?.valueChanges.subscribe((method: PaymentMethodType) => {
      this.setConditionalValidators(method);
    });

    this.setConditionalValidators(this.form.value.paymentMethod!);
  }

  ngOnInit(): void {
    let invoiceId: string | null = null;
    let payrollId: string | null = null;

    this.route.params.subscribe((params) => {
      invoiceId = params["invoiceId"];
      payrollId = params["payrollId"];
    });

    if (invoiceId) {
      this.title = "Invoice payment";
      this.fetchInvoice(invoiceId);
    } else if (payrollId) {
      this.title = "Payroll payment";
      this.fetchPayroll(payrollId);
    }
  }

  submit() {
    const paymentId = this.payroll?.payment.id ?? this.invoice?.payment.id;

    if (!this.form.valid || !paymentId) {
      return;
    }

    this.isLoading = true;
    const command: ProcessPaymentCommand = {
      paymentId: paymentId,
      paymentMethod: this.form.value.paymentMethod!,
      billingAddress: this.form.value.billingAddress!,
      cardholderName: this.form.value.cardholderName!,
      cardNumber: this.form.value.cardNumber!,
      cardCvc: this.form.value.cardCvc!,
      cardExpirationDate: this.form.value.cardExpirationDate!,
      bankName: this.form.value.bankName!,
      bankAccountNumber: this.form.value.bankAccountNumber!,
      bankRoutingNumber: this.form.value.bankRoutingNumber!,
    };

    this.apiService.processPayment(command).subscribe((result) => {
      if (result.success) {
        this.toastService.showSuccess("Payment has been processed successfully");
        this.isPaymentCompleted = true;
      } else if (result.error) {
        this.toastService.showError(result.error);
      }

      this.isLoading = false;
    });
  }

  private setConditionalValidators(paymentMethod: PaymentMethodType) {
    const cardholderName = this.form.get("cardholderName");
    const cardNumber = this.form.get("cardNumber");
    const cardExpireDate = this.form.get("cardExpireDate");
    const cardCvv = this.form.get("cardCvv");
    const bankName = this.form.get("bankName");
    const bankAccountNumber = this.form.get("bankAccountNumber");
    const bankRoutingNumber = this.form.get("bankRoutingNumber");

    if (paymentMethod === PaymentMethodType.Card) {
      cardholderName?.setValidators([Validators.required]);
      cardNumber?.setValidators([
        Validators.required,
        Validators.pattern(REGEX_PATTERNS.cardNumber),
      ]);
      cardExpireDate?.setValidators([
        Validators.required,
        Validators.pattern(REGEX_PATTERNS.cardExpDate),
      ]);
      cardCvv?.setValidators([Validators.required, Validators.pattern(REGEX_PATTERNS.cardCvc)]);
      bankName?.clearValidators();
      bankAccountNumber?.clearValidators();
      bankRoutingNumber?.clearValidators();
    } else if (paymentMethod === PaymentMethodType.UsBankAccount) {
      bankName?.setValidators([Validators.required]);
      bankAccountNumber?.setValidators([Validators.required]);
      bankRoutingNumber?.setValidators([
        Validators.required,
        Validators.pattern(REGEX_PATTERNS.usBankRoutingNumber),
      ]);
      cardholderName?.clearValidators();
      cardNumber?.clearValidators();
      cardExpireDate?.clearValidators();
      cardCvv?.clearValidators();
    } else {
      // If 'Cash' or anything else, clear all validators
      cardholderName?.clearValidators();
      cardNumber?.clearValidators();
      cardExpireDate?.clearValidators();
      cardCvv?.clearValidators();
      bankName?.clearValidators();
      bankAccountNumber?.clearValidators();
      bankRoutingNumber?.clearValidators();
    }

    cardholderName?.updateValueAndValidity();
    cardNumber?.updateValueAndValidity();
    cardExpireDate?.updateValueAndValidity();
    cardCvv?.updateValueAndValidity();
    bankName?.updateValueAndValidity();
    bankAccountNumber?.updateValueAndValidity();
    bankRoutingNumber?.updateValueAndValidity();
  }

  private fetchPayroll(payrollId: string) {
    this.isLoading = true;
    this.apiService.getPayroll(payrollId).subscribe((result) => {
      this.payroll = result.data;
      this.isPaymentCompleted = this.payroll?.payment.status === PaymentStatus.Paid;
      this.isLoading = false;
    });
  }

  private fetchInvoice(invoiceId: string) {
    this.isLoading = true;
    this.apiService.getInvoice(invoiceId).subscribe((result) => {
      this.invoice = result.data;
      this.isPaymentCompleted = this.invoice?.payment.status === PaymentStatus.Paid;
      this.isLoading = false;
    });
  }
}

interface PaymentForm {
  paymentMethod: FormControl<PaymentMethodType>;
  cardholderName: FormControl<string | null>;
  cardNumber: FormControl<string | null>;
  cardExpirationDate: FormControl<string | null>;
  cardCvc: FormControl<string | null>;
  billingAddress: FormControl<AddressDto | null>;
  bankName: FormControl<string | null>;
  bankAccountNumber: FormControl<string | null>;
  bankRoutingNumber: FormControl<string | null>;
}
