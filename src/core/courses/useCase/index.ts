import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CourseRepository } from "../repository";
import { Context } from "hono";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";

import { CategoryNotFoundError } from "../../../error/CategoryNotFoundError";
import { CategoryRepository } from "../../categories/repository";
import { ChapterRepository } from "../../chapters/repository";
import { CourseRequiredFieldsEmptyError } from "../../../error/CourseRequiredFieldsEmptyError";
import { MuxDataRepository } from "../../muxData/repository";
import Mux from "@mux/mux-node";
import { PurchaseRepository } from "../../purchase/repository";
import { PurchaseAlreadyExistsError } from "../../../error/PurchaseAlreadyExistsError";
import Stripe from "stripe";
import { stripeCustomer } from "../../../../db/schema";
import { StripeCustomerRepository } from "../../stripeCustomer/repository";
import { stripe } from "../../../lib/stripe";

/**
 * 講座のuseCaseを管理するクラス
 */
export class CourseUseCase {
  private courseRepository: CourseRepository;
  private categoryRepository: CategoryRepository;
  private purchaseRepository: PurchaseRepository;
  private stripeCustomerRepository: StripeCustomerRepository;
  private chapterRepository: ChapterRepository;
  private muxRepository: MuxDataRepository;

  constructor(private db: PostgresJsDatabase<typeof schema>) {
    this.courseRepository = new CourseRepository(this.db);
    this.categoryRepository = new CategoryRepository(this.db);
    this.purchaseRepository = new PurchaseRepository(this.db);
    this.stripeCustomerRepository = new StripeCustomerRepository(this.db);
    this.chapterRepository = new ChapterRepository(this.db);
    this.muxRepository = new MuxDataRepository(this.db);
  }

  /**
   * 講座一覧を取得する
   * @returns 講座一覧
   */
  async getCourses() {
    const courses = await this.courseRepository.getCourses();
    return courses;
  }

  /**
   * 公開講座一覧を取得する
   * @param title タイトル
   * @param categoryId カテゴリーID
   * @returns 公開講座一覧
   */
  async getPublishCourses(title?: string, categoryId?: string, userId?: string) {
    const courses = await this.courseRepository.getPublishCourses(title, categoryId, userId);
    return courses;
  }

  /**
   * 公開講座を取得する
   * @param courseId 講座ID
   * @returns 公開講座
   */
  async getPublishCourse(courseId: string, userId?: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.getPublishCourse(courseId, userId);
    return course;
  }

  /**
   * 講座を取得する
   * @param courseId 講座ID
   * @returns 講座
   */
  async getCourse(courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.getCourse(courseId);
    return course;
  }

  /**
   * 講座を登録する
   * @param title タイトル
   * @param userId ユーザーID
   * @returns 講座
   */
  async registerCourse(title: string) {
    const course = await this.courseRepository.registerCourse({ title });
    return course;
  }

  /**
   * 講座のタイトルを更新する
   * @param courseId 講座ID
   * @param title タイトル
   * @returns 講座
   */
  async updateCourseTitle(courseId: string, title: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { title });
    return course;
  }

  /**
   * 講座の詳細を更新する
   * @param courseId 講座ID
   * @param description 詳細
   * @returns 講座
   */
  async updateCourseDescription(courseId: string, description: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { description });
    return course;
  }

  /**
   * 講座のサムネイルを更新する
   * @param courseId 講座ID
   * @param imageUrl サムネイルURL
   * @returns 講座
   */
  async updateCourseThumbnail(courseId: string, imageUrl: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { imageUrl });
    return course;
  }

  /**
   * 講座の価格を更新する
   * @param courseId 講座ID
   * @param price 価格
   * @returns 講座
   */
  async updateCoursePrice(courseId: string, price: number) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { price });
    return course;
  }

  /**
   * 講座のカテゴリーを更新する
   * @param courseId 講座ID
   * @param categoryId カテゴリーID
   * @returns 講座
   */
  async updateCourseCategory(courseId: string, categoryId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    // カテゴリーの存在チェック
    const existsCategory = await this.categoryRepository.checkCategoryExists(categoryId);
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { categoryId });
    return course;
  }

  async updateCourseSourceUrl(courseId: string, sourceUrl: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { sourceUrl });
    return course;
  }

  /**
   * 講座を非公開にする
   * @param courseId 講座ID
   * @param c コンテキスト
   * @returns 講座
   */
  async unpublishCourse(courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { publishFlag: false });
    return course;
  }

  /**
   * 講座を公開する
   * @param courseId 講座ID
   * @returns 講座
   */
  async publishCourse(courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    // 講座と公開されているチャプターを取得する
    const course = await this.courseRepository.getCourse(courseId);
    const publishChapters = await this.chapterRepository.getPublishChapters(courseId);

    // 講座の必須項目を満たしているかチェック
    if (
      publishChapters.length === 0 ||
      !course.title ||
      !course.description ||
      !course.imageUrl ||
      !course.categoryId ||
      course.price === null
    ) {
      throw new CourseRequiredFieldsEmptyError();
    }

    const updatedCourse = await this.courseRepository.updateCourse(courseId, {
      publishFlag: true,
    });
    return updatedCourse;
  }

  /**
   * 講座を削除する
   * @param courseId 講座ID
   * @param c コンテキスト
   */
  async deleteCourse(courseId: string, c: Context) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    // Muxの講座に関連するデータを削除する
    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });
    const muxDataList = await this.muxRepository.getMuxDataByCourseId(courseId);
    if (muxDataList.length > 0) {
      for (const muxData of muxDataList) {
        await video.assets.delete(muxData.muxData.assetId);
      }
    }

    const course = await this.courseRepository.deleteCourse(courseId);
    return course;
  }

  /**
   * 講座を購入する
   * @param courseId 講座ID
   * @param userId ユーザーID
   * @returns 購入情報
   */
  async checkoutCourse(courseId: string, userId: string, emailAddresses: string, c: Context) {
    // 講座存在チェック
    const course = await this.courseRepository.getCourse(courseId);
    if (!course) {
      throw new CourseNotFoundError();
    }

    // 講座をすでに購入しているかチェック
    const existsPurchase = await this.purchaseRepository.existsPurchase(courseId, userId);
    if (existsPurchase) {
      throw new PurchaseAlreadyExistsError();
    }

    // 購入情報を作成する
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency: "JPY",
          product_data: {
            name: course.title,
            description: course.description!,
          },
          unit_amount: course.price!,
        },
      },
    ];

    let customer = await this.stripeCustomerRepository.getStripeCustomer(userId);

    const stripeInstance = stripe(c);

    if (!customer) {
      const stripeCustomer = await stripeInstance.customers.create({
        email: emailAddresses,
      });

      customer = await this.stripeCustomerRepository.registerStripeCustomer(
        userId,
        stripeCustomer.id,
      );
    }

    const session = await stripeInstance.checkout.sessions.create({
      customer: customer.stripeCustomerId,
      line_items,
      mode: "payment",
      success_url: `${c.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?success=1`,
      cancel_url: `${c.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?canceled=1`,
      metadata: {
        courseId: course.id,
        userId: userId,
      },
    });
    return session.url;
  }

  /**
   * 購入済み講座一覧を取得する
   * @param userId ユーザーID
   * @returns 購入済み講座一覧
   */
  async getPurchaseCourses(userId: string) {
    const courses = await this.courseRepository.getPurchaseCourses(userId);
    return courses;
  }
}
